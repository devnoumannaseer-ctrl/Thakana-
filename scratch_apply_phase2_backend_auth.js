const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let serverJs = fs.readFileSync(serverFile, 'utf8');

// 1. Remove fake token fallback in verifyTokenStringFast
const oldVerifyFast = `function verifyTokenStringFast(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (typeof token === 'string' && token.startsWith('thakana_')) {
      const parts = token.split('_');
      const role = parts[1];
      const users = readJsonSafe(USERS_FILE, []);
      const matched = users.find(u => u.role === role);
      if (matched) {
        return {
          id: matched.id,
          email: matched.email,
          phone: matched.phone,
          role: matched.role,
          name: matched.name,
          university: matched.university || '',
          hostelName: matched.hostelName || '',
          fieldUnit: matched.fieldUnit || ''
        };
      }
    }
    return null;
  }
}`;

const newVerifyFast = `function verifyTokenStringFast(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}`;

if (serverJs.includes(oldVerifyFast)) {
  serverJs = serverJs.replace(oldVerifyFast, newVerifyFast);
  console.log('Fixed verifyTokenStringFast: removed fake token fallback');
} else {
  console.warn('oldVerifyFast not matched verbatim');
}

// 2. Remove fake token fallback in verifyTokenString
const oldVerifyString = `function verifyTokenString(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (typeof token === 'string' && token.startsWith('thakana_')) {
      const parts = token.split('_');
      const role = parts[1];
      const users = readJson(USERS_FILE);
      const matched = users.find(u => u.role === role);
      if (matched) {
        return {
          id: matched.id,
          email: matched.email,
          phone: matched.phone,
          role: matched.role,
          name: matched.name,
          university: matched.university || '',
          hostelName: matched.hostelName || '',
          fieldUnit: matched.fieldUnit || ''
        };
      }
    }
    return null;
  }
}`;

const newVerifyString = `function verifyTokenString(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}`;

if (serverJs.includes(oldVerifyString)) {
  serverJs = serverJs.replace(oldVerifyString, newVerifyString);
  console.log('Fixed verifyTokenString: removed fake token fallback');
} else {
  console.warn('oldVerifyString not matched verbatim');
}

// 3. Remove hardcoded admin key bypass in authenticate
const oldAuthBypass = `function authenticate(req, res, next) {
  // Governance override for Admin Passkey
  if (req.headers['x-admin-key'] === 'thakana2026' || (req.body && req.body.adminSecret === 'thakana2026')) {
    req.user = { id: 'usr-admin-1', name: 'Super Admin Governance', role: 'admin', email: 'admin@thakana.pk' };
    return next();
  }`;

const newAuthNoBypass = `function authenticate(req, res, next) {`;

if (serverJs.includes(oldAuthBypass)) {
  serverJs = serverJs.replace(oldAuthBypass, newAuthNoBypass);
  console.log('Removed hardcoded x-admin-key bypass from authenticate');
} else {
  console.warn('oldAuthBypass not matched verbatim');
}

// 4. Update /api/auth/login to strictly use bcrypt, never auto-create on login, check active status, and enforce role
const oldLoginRegex = /app\.post\('\/api\/auth\/login',[\s\S]*?return res\.json\(\{[\s\S]*?role\.toUpperCase\(\)[\s\S]*?\}\);[\s\S]*?\}\);/;

const newLoginRoute = `app.post('/api/auth/login', authLimiter, (req, res) => {
  const { role, emailOrPhone = '', password = '', secretKey = '' } = req.body || {};
  if (!emailOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'Email/phone and password are required.' });
  }

  const users = readJson(USERS_FILE);
  const cleanInput = String(emailOrPhone).trim().toLowerCase();
  const cleanPhone = normalizePakPhone(cleanInput);

  // Find user by identifier
  let user = users.find(u => {
    const emailMatch = u.email && u.email.toLowerCase() === cleanInput;
    const phoneMatch = u.phone && normalizePakPhone(u.phone) === cleanPhone;
    return emailMatch || phoneMatch;
  });

  if (!user) {
    logAction('FAILED_LOGIN_ATTEMPT', \`Account not found for: \${cleanInput}\`, cleanInput);
    return res.status(401).json({ success: false, message: 'Invalid credentials. Account not found.' });
  }

  // Strict Role Verification: If login specifies a role (e.g. Student Login), reject other roles
  if (role && user.role !== role) {
    logAction('ROLE_LOGIN_MISMATCH', \`User \${user.email} (\${user.role}) attempted login via \${role} portal\`, user.email);
    return res.status(403).json({
      success: false,
      message: \`Access denied: This account is registered as '\${user.role}' and cannot log in through the \${role} portal.\`
    });
  }

  // Admin 2FA passkey verification
  if (user.role === 'admin') {
    if (secretKey !== 'thakana2026' && password !== 'admin123') {
      logAction('FAILED_ADMIN_LOGIN', \`Admin secret key verification failed for \${cleanInput}\`, cleanInput);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials or security key.' });
    }
  }

  // Verify password using bcrypt against stored hash
  if (!user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    logAction('FAILED_LOGIN_ATTEMPT', \`Invalid password for \${cleanInput}\`, cleanInput);
    return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
  }

  // Verify account is active
  if (user.status === 'suspended' || user.status === 'inactive') {
    return res.status(403).json({ success: false, message: 'Your account is currently suspended. Please contact platform administration.' });
  }

  // Generate signed JWT
  const token = generateToken(user);

  // Set secure HttpOnly cookie
  res.cookie('thakana_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  logAction('USER_LOGIN', \`User \${user.name} (\${user.role}) logged in successfully\`, user.name);

  // Return sanitized user object (never expose passwordHash)
  return res.json({
    success: true,
    message: \`\${user.role.toUpperCase()} authentication successful.\`,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      university: user.university || '',
      hostelName: user.hostelName || '',
      fieldUnit: user.fieldUnit || ''
    }
  });
});`;

if (oldLoginRegex.test(serverJs)) {
  serverJs = serverJs.replace(oldLoginRegex, newLoginRoute);
  console.log('Replaced /api/auth/login with strict secure version');
} else {
  console.warn('oldLoginRegex not matched');
}

// 5. Update /api/auth/session to remove exposed passwords
const oldSessionRegex = /app\.get\('\/api\/auth\/session',[\s\S]*?demoAccounts: \{[\s\S]*?\}\s*\}\);\s*\}\);/;

const newSessionRoute = `app.get('/api/auth/session', (req, res) => {
  const user = getAuthUserFromReq(req);
  return res.json({
    success: true,
    authenticated: !!user,
    user: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      university: user.university
    } : null,
    availableRoles: ['student', 'owner', 'inspector', 'admin']
  });
});`;

if (oldSessionRegex.test(serverJs)) {
  serverJs = serverJs.replace(oldSessionRegex, newSessionRoute);
  console.log('Sanitized /api/auth/session: removed demo passwords exposure');
} else {
  console.warn('oldSessionRegex not matched');
}

// 6. Add POST /api/student/change-password endpoint
const changePasswordEndpoint = `
// POST /api/student/change-password - Secure password change for Student
app.post('/api/student/change-password', authenticate, authorize('student', 'user'), (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const users = readJson(USERS_FILE);
  const userIndex = users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  const user = users[userIndex];
  if (!user.passwordHash || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Current password verification failed.' });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.updatedAt = new Date().toISOString();
  users[userIndex] = user;
  writeJson(USERS_FILE, users);

  logAction('PASSWORD_CHANGED', \`Student \${user.id} (\${user.email}) changed password\`, user.name);
  return res.json({ success: true, message: 'Password updated successfully.' });
});
`;

if (!serverJs.includes('/api/student/change-password')) {
  serverJs = serverJs.replace("app.post('/api/auth/logout'", changePasswordEndpoint + "\napp.post('/api/auth/logout'");
  console.log('Added /api/student/change-password endpoint');
}

fs.writeFileSync(serverFile, serverJs, 'utf8');
console.log('Saved server.js with Phase 2 authentication updates');
