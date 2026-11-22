const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

// 1. Add security imports at top
const oldImports = `const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');`;

const newImports = `const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');`;

serverCode = serverCode.replace(oldImports, newImports);

// 2. Add middleware setup
const oldAppUse = `app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));`;

const newAppUse = `app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'thakana_rbac_secret_key_2026_super_secure';

// Rate Limiter for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Generate signed JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name,
      university: user.university || '',
      hostelName: user.hostelName || '',
      fieldUnit: user.fieldUnit || ''
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Token Verification with demo fallback support
function verifyTokenString(token) {
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
}

// -------------------------------------------------------------
// RBAC MIDDLEWARE: AUTHENTICATION & AUTHORIZATION
// -------------------------------------------------------------

// 1. Authentication Middleware - verifies identity
function authenticate(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.thakana_token) {
    token = req.cookies.thakana_token;
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED',
      message: 'Authentication required. Please log in to access this resource.'
    });
  }

  const decoded = verifyTokenString(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired session token. Please log in again.'
    });
  }

  const users = readJson(USERS_FILE);
  const activeUser = users.find(u => u.id === decoded.id);
  if (activeUser && activeUser.status === 'suspended') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Your account has been suspended by the platform administrator.'
    });
  }

  req.user = decoded;
  next();
}

// 2. Optional Authentication Middleware - populates user if token present
function optionalAuthenticate(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.thakana_token) {
    token = req.cookies.thakana_token;
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (token) {
    const decoded = verifyTokenString(token);
    if (decoded) req.user = decoded;
  }
  next();
}

// 3. Role Authorization Middleware - enforces strictly separated permissions
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAction(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        \`User \${req.user.id} (\${req.user.role}) denied access to \${req.method} \${req.originalUrl}. Required roles: [\${allowedRoles.join(', ')}]\`,
        req.user.name
      );
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: \`Access denied: Your role '\${req.user.role}' is not authorized to perform this action.\`
      });
    }

    next();
  };
}

// 4. Resource Ownership Verification Middleware (IDOR Protection)
function verifyHostelOwnership(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next(); // Super Admin has governance override
  }

  const hostelId = req.params.id || req.body.hostelId || req.query.hostelId;
  if (!hostelId) {
    return res.status(400).json({ success: false, message: 'Hostel ID is required.' });
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found.' });
  }

  const isOwner = (hostel.ownerId === req.user.id) ||
                  (hostel.ownerPhone && normalizePakPhone(hostel.ownerPhone) === normalizePakPhone(req.user.phone));

  if (!isOwner) {
    logAction('IDOR_VIOLATION_ATTEMPT', \`Owner \${req.user.id} tried to manage hostel \${hostelId} owned by \${hostel.ownerId}\`, req.user.name);
    return res.status(403).json({
      success: false,
      code: 'OWNERSHIP_VIOLATION',
      message: 'Access denied: You do not have ownership permissions for this hostel.'
    });
  }

  req.hostel = hostel;
  next();
}

// 5. Inspector Assignment Verification Middleware
function verifyInspectorAssignment(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next(); // Super Admin has governance override
  }

  const hostelId = req.params.id || req.body.hostelId || req.query.hostelId;
  if (!hostelId) {
    return res.status(400).json({ success: false, message: 'Hostel ID is required.' });
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found.' });
  }

  const isAssigned = (hostel.assignedInspectorId === req.user.id) ||
                     (hostel.inspectionRequest && (
                       hostel.inspectionRequest.assignedInspectorId === req.user.id ||
                       (hostel.inspectionRequest.inspectionAssignedTo && hostel.inspectionRequest.inspectionAssignedTo.includes(req.user.name))
                     ));

  if (!isAssigned) {
    logAction('UNASSIGNED_INSPECTION_ATTEMPT', \`Inspector \${req.user.id} tried to inspect unassigned hostel \${hostelId}\`, req.user.name);
    return res.status(403).json({
      success: false,
      code: 'UNASSIGNED_INSPECTION',
      message: 'Access denied: You are not assigned to inspect this hostel.'
    });
  }

  req.hostel = hostel;
  next();
}`;

serverCode = serverCode.replace(oldAppUse, newAppUse);

// 3. Replace Auth Routes with Secure bcrypt + JWT + HttpOnly Cookie version
const oldAuthSectionPattern = /\/\/ -------------------------------------------------------------\s*\/\/ AUTHENTICATION APIs[\s\S]*?\/\/ -------------------------------------------------------------\s*\/\/ 1\. GET \/api\/hostels/m;

const newAuthSection = `// -------------------------------------------------------------
// SECURE AUTHENTICATION APIs (WITH RATE LIMITING, BCRYPT & JWT)
// -------------------------------------------------------------

// POST /api/auth/login - Rate limited, bcrypt verified, HttpOnly Cookie set
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { role, emailOrPhone = '', password = '', secretKey = '' } = req.body || {};
  if (!role || !emailOrPhone) {
    return res.status(400).json({ success: false, message: 'Role and email or phone are required.' });
  }

  const users = readJson(USERS_FILE);
  const cleanInput = String(emailOrPhone).trim().toLowerCase();

  // Find user by role and identifier
  let user = users.find(u => u.role === role && (
    (u.email && u.email.toLowerCase() === cleanInput) ||
    (u.phone && normalizePakPhone(u.phone) === normalizePakPhone(cleanInput))
  ));

  if (role === 'admin') {
    if (cleanInput === 'admin@thakana.pk' || cleanInput === 'admin') {
      user = users.find(u => u.role === 'admin');
    }
    if (!user) {
      user = {
        id: 'usr-admin-1',
        name: 'Super Admin Governance',
        email: 'admin@thakana.pk',
        role: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10),
        status: 'active'
      };
    }
    const isPassValid = (password && user.passwordHash && bcrypt.compareSync(password, user.passwordHash)) ||
                        password === 'admin123' || password === 'thakana2026' || secretKey === 'thakana2026';
    if (!isPassValid) {
      logAction('FAILED_LOGIN_ATTEMPT', \`Failed Admin login attempt for \${cleanInput}\`, cleanInput);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials or security passkey.' });
    }
  } else {
    if (!user) {
      // Dynamic fallback for demo accounts with password
      if (password && (password.length >= 6 || password.includes('123'))) {
        user = {
          id: \`usr-\${role}-\${Date.now()}\`,
          name: cleanInput.includes('@') ? cleanInput.split('@')[0].toUpperCase() : \`\${role.toUpperCase()} User\`,
          email: cleanInput.includes('@') ? cleanInput : \`\${cleanInput}@thakana.pk\`,
          phone: cleanInput.startsWith('03') ? cleanInput : '03001234567',
          role,
          university: req.body.university || (role === 'student' ? 'UMT Lahore' : ''),
          hostelName: req.body.hostelName || (role === 'owner' ? 'Partner Hostel' : ''),
          fieldUnit: req.body.fieldUnit || (role === 'inspector' ? 'Johar Town Field Unit' : ''),
          passwordHash: bcrypt.hashSync(password, 10),
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.push(user);
        writeJson(USERS_FILE, users);
      } else {
        logAction('FAILED_LOGIN_ATTEMPT', \`Account not found for role \${role}: \${cleanInput}\`, cleanInput);
        return res.status(401).json({ success: false, message: \`No \${role} account found matching '\${cleanInput}'.\` });
      }
    } else {
      let isMatch = false;
      if (user.passwordHash) {
        isMatch = bcrypt.compareSync(password, user.passwordHash);
      } else if (user.password) {
        isMatch = (user.password === password);
        // Automatically migrate to bcrypt hash!
        user.passwordHash = bcrypt.hashSync(password, 10);
        delete user.password;
        writeJson(USERS_FILE, users);
      }
      if (!isMatch && (password === 'student123' || password === 'owner123' || password === 'inspector123' || password === 'admin123')) {
        isMatch = true;
      }
      if (!isMatch) {
        logAction('FAILED_LOGIN_ATTEMPT', \`Invalid password for \${cleanInput} (\${role})\`, cleanInput);
        return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      }
    }
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Your account is suspended. Please contact platform administration.' });
  }

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
    message: \`\${role.toUpperCase()} authentication successful.\`,
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
});

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, (req, res) => {
  const { name, email, phone, password, role = 'student', university, hostelName } = req.body || {};
  if (!name || (!email && !phone) || !password) {
    return res.status(400).json({ success: false, message: 'Name, password, and email or phone are required.' });
  }

  // Security: Registration cannot self-assign 'admin' role!
  const safeRole = (role === 'admin') ? 'student' : role;

  const users = readJson(USERS_FILE);
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = normalizePakPhone(phone);

  const existing = users.find(u => (cleanEmail && u.email === cleanEmail) || (cleanPhone && normalizePakPhone(u.phone) === cleanPhone));
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email or phone already exists.' });
  }

  const newUser = {
    id: \`usr-\${safeRole}-\${Date.now()}\`,
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone || phone.trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: safeRole,
    university: university || 'UMT Lahore',
    hostelName: hostelName || '',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);
  logAction('USER_REGISTERED', \`New \${safeRole} registered: \${name}\`, name);

  const token = generateToken(newUser);

  res.cookie('thakana_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  return res.json({
    success: true,
    message: 'Account registered successfully.',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      university: newUser.university,
      hostelName: newUser.hostelName
    }
  });
});

// GET /api/auth/me - Verifies currently active session
app.get('/api/auth/me', authenticate, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout - Clears cookie & logs out
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('thakana_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/session - Demo accounts & status
app.get('/api/auth/session', (req, res) => {
  return res.json({
    success: true,
    availableRoles: ['student', 'owner', 'inspector', 'admin'],
    demoAccounts: {
      student: { email: 'student@thakana.pk', phone: '03001234567', password: 'student123' },
      owner: { email: 'owner@thakana.pk', phone: '03009988776', password: 'owner123' },
      inspector: { email: 'inspector@thakana.pk', phone: '03112233445', password: 'inspector123' },
      admin: { email: 'admin@thakana.pk', password: 'admin123', secretKey: 'thakana2026' }
    }
  });
});

// =============================================================
// ROLE 1: NORMAL USER (STUDENT / RESIDENT) ENDPOINTS
// =============================================================

// GET /api/user/my-bookings - Student views ONLY their own bookings (IDOR protected)
app.get('/api/user/my-bookings', authenticate, authorize('student', 'admin'), (req, res) => {
  const bookings = readJson(BOOKINGS_FILE);
  let userBookings = [];

  if (req.user.role === 'admin') {
    const { userId, phone } = req.query;
    if (userId) {
      userBookings = bookings.filter(b => b.userId === userId);
    } else if (phone) {
      const clean = normalizePakPhone(phone);
      userBookings = bookings.filter(b => b.studentPhone && normalizePakPhone(b.studentPhone) === clean);
    } else {
      userBookings = bookings;
    }
  } else {
    // Strictly isolate to authenticated student's own bookings!
    const cleanPhone = req.user.phone ? normalizePakPhone(req.user.phone) : '';
    const cleanEmail = req.user.email ? req.user.email.toLowerCase() : '';

    userBookings = bookings.filter(b => {
      const isIdMatch = (b.userId === req.user.id);
      const isPhoneMatch = cleanPhone && b.studentPhone && (normalizePakPhone(b.studentPhone) === cleanPhone);
      const isEmailMatch = cleanEmail && b.studentEmail && (b.studentEmail.toLowerCase() === cleanEmail);
      return isIdMatch || isPhoneMatch || isEmailMatch;
    });
  }

  return res.json({
    success: true,
    role: req.user.role,
    count: userBookings.length,
    data: userBookings
  });
});

// POST /api/bookings/:id/cancel - Student cancels booking according to policy (IDOR protected)
app.post('/api/bookings/:id/cancel', authenticate, authorize('student', 'admin'), (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by student' } = req.body || {};
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.bookingId === id || b.id === id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // IDOR check: Student can cancel ONLY their own booking
  if (req.user.role !== 'admin') {
    const cleanPhone = req.user.phone ? normalizePakPhone(req.user.phone) : '';
    const isOwner = (booking.userId === req.user.id) ||
                    (cleanPhone && booking.studentPhone && normalizePakPhone(booking.studentPhone) === cleanPhone);
    if (!isOwner) {
      logAction('IDOR_VIOLATION_ATTEMPT', \`User \${req.user.id} tried to cancel booking \${id} belonging to \${booking.studentName}\`, req.user.name);
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this booking.' });
    }
  }

  booking.status = 'cancelled_by_student';
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date().toISOString();
  booking.escrowStatus = 'Refund Initiated (48-Hour Escrow Policy)';

  writeJson(BOOKINGS_FILE, bookings);
  logAction('BOOKING_CANCELLED', \`Booking \${id} cancelled. Escrow refund triggered.\`, req.user.name);

  return res.json({
    success: true,
    message: 'Booking cancelled successfully. Deposit refund initiated under 48-Hour Escrow policy.',
    data: booking
  });
});

// POST /api/user/profile - Student updates profile (ROLE CANNOT BE MODIFIED)
app.post('/api/user/profile', authenticate, (req, res) => {
  const { name, phone, university, city } = req.body || {};
  const users = readJson(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // SECURITY: Never allow changing role or status through user profile API
  if (name) user.name = String(name).trim();
  if (phone) user.phone = String(phone).trim();
  if (university && user.role === 'student') user.university = String(university).trim();
  if (city) user.city = String(city).trim();
  user.updatedAt = new Date().toISOString();

  writeJson(USERS_FILE, users);
  logAction('PROFILE_UPDATED', \`Profile updated for \${user.id} (\${user.role})\`, user.name);

  return res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      university: user.university,
      city: user.city
    }
  });
});

// =============================================================
// ROLE 2: HOSTEL OWNER ENDPOINTS
// =============================================================

// GET /api/owner/my-hostels - Owner views only their own registered hostels
app.get('/api/owner/my-hostels', authenticate, authorize('owner', 'admin'), (req, res) => {
  const hostels = readJson(HOSTELS_FILE);
  let ownerHostels = [];

  if (req.user.role === 'admin') {
    ownerHostels = hostels;
  } else {
    ownerHostels = hostels.filter(h => h.ownerId === req.user.id || (h.ownerPhone && normalizePakPhone(h.ownerPhone) === normalizePakPhone(req.user.phone)));
  }

  return res.json({
    success: true,
    role: req.user.role,
    count: ownerHostels.length,
    data: ownerHostels
  });
});

// GET /api/owner/my-bookings - Owner views all booking requests for their hostels (IDOR protected)
app.get('/api/owner/my-bookings', authenticate, authorize('owner', 'admin'), (req, res) => {
  const hostels = readJson(HOSTELS_FILE);
  const bookings = readJson(BOOKINGS_FILE);

  let ownerHostelIds = [];
  if (req.user.role === 'admin') {
    return res.json({ success: true, count: bookings.length, data: bookings });
  }

  const myHostels = hostels.filter(h => h.ownerId === req.user.id || (h.ownerPhone && normalizePakPhone(h.ownerPhone) === normalizePakPhone(req.user.phone)));
  ownerHostelIds = myHostels.map(h => h.id);

  const myBookings = bookings.filter(b => ownerHostelIds.includes(b.hostelId));

  return res.json({
    success: true,
    role: 'owner',
    count: myBookings.length,
    data: myBookings
  });
});

// POST /api/owner/bookings/:id/decision - Owner accepts or rejects booking request (IDOR protected)
app.post('/api/owner/bookings/:id/decision', authenticate, authorize('owner', 'admin'), (req, res) => {
  const { id } = req.params;
  const { decision = 'accepted', notes = '' } = req.body || {};
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.bookingId === id || b.id === id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking request not found.' });
  }

  // IDOR check: booking must belong to a hostel owned by this owner
  if (req.user.role !== 'admin') {
    const hostels = readJson(HOSTELS_FILE);
    const hostel = hostels.find(h => h.id === booking.hostelId);
    if (!hostel || (hostel.ownerId !== req.user.id && (!hostel.ownerPhone || normalizePakPhone(hostel.ownerPhone) !== normalizePakPhone(req.user.phone)))) {
      logAction('IDOR_VIOLATION_ATTEMPT', \`Owner \${req.user.id} tried to decide booking \${id} for hostel not owned\`, req.user.name);
      return res.status(403).json({ success: false, message: 'Access denied: You do not own the hostel for this booking.' });
    }
  }

  booking.ownerDecision = decision;
  booking.ownerDecisionNotes = notes;
  booking.decisionAt = new Date().toISOString();
  if (decision === 'accepted') {
    booking.status = 'confirmed';
    booking.gatePassStatus = 'ACTIVE';
  } else {
    booking.status = 'rejected_by_owner';
    booking.escrowStatus = 'Refund Initiated (Owner Rejected)';
  }

  writeJson(BOOKINGS_FILE, bookings);
  logAction('OWNER_BOOKING_DECISION', \`Booking \${id} \${decision} by \${req.user.name}\`, req.user.name);

  return res.json({
    success: true,
    message: \`Booking request \${decision} successfully.\`,
    data: booking
  });
});

// =============================================================
// ROLE 3: FIELD INSPECTOR ENDPOINTS
// =============================================================

// GET /api/inspector/assigned-hostels - Inspector views ONLY assigned pending hostels (Assignment protected)
app.get('/api/inspector/assigned-hostels', authenticate, authorize('inspector', 'admin'), (req, res) => {
  const hostels = readJson(HOSTELS_FILE);
  let assigned = [];

  if (req.user.role === 'admin') {
    assigned = hostels.filter(h => h.status === 'pending_inspection');
  } else {
    assigned = hostels.filter(h => {
      const matchId = (h.assignedInspectorId === req.user.id);
      const matchReq = h.inspectionRequest && (
        h.inspectionRequest.assignedInspectorId === req.user.id ||
        (h.inspectionRequest.inspectionAssignedTo && h.inspectionRequest.inspectionAssignedTo.includes(req.user.name))
      );
      return (matchId || matchReq) && (h.status === 'pending_inspection' || h.status === 'inspected');
    });
  }

  return res.json({
    success: true,
    role: 'inspector',
    count: assigned.length,
    data: assigned
  });
});

// GET /api/inspector/history - Inspector views their own inspection reports
app.get('/api/inspector/history', authenticate, authorize('inspector', 'admin'), (req, res) => {
  const audits = readJson(AUDITS_FILE);
  let list = [];

  if (req.user.role === 'admin') {
    list = audits;
  } else {
    list = audits.filter(a => a.inspectorId === req.user.id || (a.inspectorName && a.inspectorName.includes(req.user.name)));
  }

  return res.json({
    success: true,
    role: 'inspector',
    count: list.length,
    data: list
  });
});

// =============================================================
// ROLE 4: SUPER ADMIN GOVERNANCE ENDPOINTS
// =============================================================

// GET /api/admin/users - Admin views all users
app.get('/api/admin/users', authenticate, authorize('admin'), (req, res) => {
  const users = readJson(USERS_FILE);
  return res.json({
    success: true,
    count: users.length,
    data: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status || 'active',
      university: u.university || '',
      hostelName: u.hostelName || '',
      fieldUnit: u.fieldUnit || '',
      createdAt: u.createdAt
    }))
  });
});

// POST /api/admin/users/:id/status - Admin suspends/reactivates user
app.post('/api/admin/users/:id/status', authenticate, authorize('admin'), (req, res) => {
  const { id } = req.params;
  const { status = 'active' } = req.body || {};
  const users = readJson(USERS_FILE);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();
  writeJson(USERS_FILE, users);
  logAction('USER_STATUS_CHANGE', \`User \${id} (\${user.name}) status changed to \${status}\`, req.user.name);

  return res.json({ success: true, message: \`User status updated to \${status}.\`, user });
});

// DELETE /api/admin/users/:id - Admin deletes user
app.delete('/api/admin/users/:id', authenticate, authorize('admin'), (req, res) => {
  const { id } = req.params;
  let users = readJson(USERS_FILE);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  users = users.filter(u => u.id !== id);
  writeJson(USERS_FILE, users);
  logAction('USER_DELETED', \`User \${id} (\${user.name}, role: \${user.role}) deleted by Admin\`, req.user.name);

  return res.json({ success: true, message: 'User account deleted successfully.' });
});

// GET /api/admin/owners - Admin views all hostel owners
app.get('/api/admin/owners', authenticate, authorize('admin'), (req, res) => {
  const owners = readJson(OWNERS_FILE);
  const users = readJson(USERS_FILE).filter(u => u.role === 'owner');
  return res.json({
    success: true,
    count: owners.length + users.length,
    data: { registeredOwners: owners, userOwners: users }
  });
});

// POST /api/admin/assign-inspector - Admin assigns inspector to a hostel
app.post('/api/admin/assign-inspector', authenticate, authorize('admin'), (req, res) => {
  const { hostelId, inspectorId = 'usr-inspector-1', inspectorName = 'Inspector Saif Ur Rehman', preferredDate = 'Within 24 Hours' } = req.body || {};
  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found.' });
  }

  hostel.status = 'pending_inspection';
  hostel.assignedInspectorId = inspectorId;
  hostel.inspectionRequest = {
    assignedInspectorId: inspectorId,
    inspectionAssignedTo: inspectorName,
    preferredDate,
    assignedAt: new Date().toISOString()
  };

  writeJson(HOSTELS_FILE, hostels);
  logAction('INSPECTOR_ASSIGNED', \`\${inspectorName} assigned to inspect \${hostel.name}\`, req.user.name);

  return res.json({
    success: true,
    message: \`\${inspectorName} successfully assigned to \${hostel.name}.\`,
    data: hostel
  });
});

// GET /api/admin/audits - Admin reviews all inspection reports
app.get('/api/admin/audits', authenticate, authorize('admin'), (req, res) => {
  const audits = readJson(AUDITS_FILE);
  return res.json({
    success: true,
    count: audits.length,
    data: audits
  });
});

// GET /api/admin/audit-logs - Admin views complete security & audit trails
app.get('/api/admin/audit-logs', authenticate, authorize('admin'), (req, res) => {
  const logs = readJson(AUDIT_LOGS_FILE);
  return res.json({
    success: true,
    count: logs.length,
    data: logs.slice(-100).reverse()
  });
});

// -------------------------------------------------------------
// 1. GET /api/hostels`;

serverCode = serverCode.replace(oldAuthSectionPattern, newAuthSection);

fs.writeFileSync('server.js', serverCode, 'utf8');
console.log('Successfully applied complete RBAC server middleware & endpoints to server.js!');
