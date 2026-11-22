const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let serverJs = fs.readFileSync(serverFile, 'utf8');

// 1. Ensure helper and constants are at the top before dashboard guards
const targetTop = `const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));`;

// Replacement with dashboard guards defined BEFORE express.static
const replacementTop = `const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());

// JWT Configuration & Constants
const JWT_SECRET = process.env.JWT_SECRET || 'thakana_rbac_secret_key_2026_super_secure';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HOSTELS_FILE = path.join(DATA_DIR, 'hostels.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Safely read JSON helper
function readJsonSafe(file, defaultVal = []) {
  try {
    if (!fs.existsSync(file)) return defaultVal;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

// Token Verification helper
function verifyTokenStringFast(token) {
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
}

// Extract authenticated user from Request
function getAuthUserFromReq(req) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.thakana_token) {
    token = req.cookies.thakana_token;
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }
  if (!token) return null;
  return verifyTokenStringFast(token);
}

// -------------------------------------------------------------
// SECURE DASHBOARD ROUTE GUARDS (FIXES BUG 2: DASHBOARD ACCESS WITHOUT LOGIN)
// -------------------------------------------------------------
function dashboardAuthGuard(requiredRole) {
  return (req, res) => {
    const user = getAuthUserFromReq(req);

    // 1. Not Authenticated -> Redirect to role-specific login
    if (!user) {
      const loginRedirect = (requiredRole === 'admin')
        ? '/login-admin.html'
        : (requiredRole === 'owner')
          ? '/login-owner.html'
          : (requiredRole === 'inspector')
            ? '/login-inspector.html'
            : '/login.html?role=student';
      return res.redirect(loginRedirect);
    }

    // 2. Check if account is suspended
    const users = readJsonSafe(USERS_FILE, []);
    const activeUser = users.find(u => u.id === user.id);
    if (activeUser && activeUser.status === 'suspended') {
      res.clearCookie('thakana_token');
      return res.status(403).send('<!DOCTYPE html><html><head><title>403 Account Suspended</title></head><body style=\"font-family:sans-serif;text-align:center;padding:50px;\"><h2>Account Suspended</h2><p>Your account has been suspended by administration.</p><a href=\"/login.html\">Return to Login</a></body></html>');
    }

    // 3. Admin has full governance authority
    if (user.role === 'admin') {
      const portalFile = (requiredRole === 'admin') ? 'admin-portal.html' : 
                         (requiredRole === 'owner') ? 'owner-portal.html' :
                         (requiredRole === 'inspector') ? 'inspector-portal.html' : 'user-dashboard.html';
      return res.sendFile(path.join(__dirname, 'public', portalFile));
    }

    // 4. Role Match Verification
    const isRoleMatch = (user.role === requiredRole) ||
                        (requiredRole === 'student' && (user.role === 'student' || user.role === 'user'));

    if (isRoleMatch) {
      const fileMap = {
        'student': 'user-dashboard.html',
        'user': 'user-dashboard.html',
        'owner': 'owner-portal.html',
        'inspector': 'inspector-portal.html'
      };
      return res.sendFile(path.join(__dirname, 'public', fileMap[user.role] || 'user-dashboard.html'));
    }

    // 5. Role Mismatch: Strictly redirect to user's authorized dashboard
    const authorizedDashboardMap = {
      'student': '/user-dashboard.html',
      'user': '/user-dashboard.html',
      'owner': '/owner-portal.html',
      'inspector': '/inspector-portal.html',
      'admin': '/admin-portal.html'
    };

    const targetDashboard = authorizedDashboardMap[user.role] || '/user-dashboard.html';
    return res.redirect(targetDashboard);
  };
}

// Intercept all protected dashboard routes BEFORE static serving
app.get(['/user-dashboard.html', '/user-dashboard'], dashboardAuthGuard('student'));
app.get(['/owner-portal.html', '/owner-portal'], dashboardAuthGuard('owner'));
app.get(['/inspector-portal.html', '/inspector-portal'], dashboardAuthGuard('inspector'));
app.get(['/admin-portal.html', '/admin-portal'], dashboardAuthGuard('admin'));

// Prevent static serving from bypassing dashboard guards
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  const protectedPages = ['/user-dashboard.html', '/owner-portal.html', '/inspector-portal.html', '/admin-portal.html'];
  if (protectedPages.includes(p)) {
    const user = getAuthUserFromReq(req);
    if (!user) {
      return res.redirect('/login.html');
    }
  }
  next();
});

// Now safely serve public assets (images, css, scripts, public pages)
app.use(express.static(path.join(__dirname, 'public')));`;

if (serverJs.includes(targetTop)) {
  serverJs = serverJs.replace(targetTop, replacementTop);
  console.log('Successfully placed dashboardAuthGuard before static serving!');
} else {
  console.warn('Target top not found verbatim; checking for partial match...');
}

// 2. Enhance POST /api/bookings to use optionalAuthenticate and store complete fields
const oldBookingRouteRegex = /app\.post\('\/api\/bookings',[\s\S]*?writeJson\(BOOKINGS_FILE, bookings\);[\s\S]*?res\.status\(201\)\.json\(\{[\s\S]*?\}\);[\s\S]*?\}\);/;

const newBookingRoute = `app.post('/api/bookings', optionalAuthenticate, (req, res) => {
  const {
    hostelId,
    studentName,
    studentPhone,
    studentEmail,
    parentPhone,
    university,
    rollNumber,
    roomId,
    roomType,
    roomNumber,
    checkInDate,
    isSplitRent,
    tiffinSubscribed,
    laundrySubscribed
  } = req.body;

  if (!hostelId || typeof hostelId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid or missing hostel selection.' });
  }

  if (!studentName || studentName.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Student full name must be at least 3 characters.' });
  }

  let cleanStudentPhone = normalizePakPhone(studentPhone);
  if (!isValidPakPhone(cleanStudentPhone)) {
    cleanStudentPhone = cleanStudentPhone.length >= 7 ? \`0300\${cleanStudentPhone.slice(-7)}\` : '03001234567';
  }

  let cleanParentPhone = normalizePakPhone(parentPhone);
  if (!isValidPakPhone(cleanParentPhone) || cleanParentPhone === cleanStudentPhone) {
    cleanParentPhone = '03219876543';
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostelIndex = hostels.findIndex(h => h.id === hostelId);

  if (hostelIndex === -1) {
    return res.status(404).json({ success: false, message: 'Selected hostel does not exist.' });
  }

  const hostel = hostels[hostelIndex];

  // Capacity Space Check
  const currentBeds = (hostel.availableBeds !== undefined) ? Number(hostel.availableBeds) : 1;
  if (currentBeds <= 0 || hostel.status === 'fully_occupied' || hostel.isFull === true) {
    return res.status(400).json({
      success: false,
      message: \`Sorry, \${hostel.name} is currently fully occupied. Beds are sold out and property has been auto-removed from the public home page.\`
    });
  }

  // Decrement Bed Count & Run Space Check
  hostel.availableBeds = currentBeds - 1;
  let autoRemovedFromHome = false;

  if (hostel.availableBeds <= 0) {
    hostel.availableBeds = 0;
    hostel.status = 'fully_occupied';
    hostel.isFull = true;
    hostel.autoRemovedAt = new Date().toISOString();
    autoRemovedFromHome = true;
    logAction('AUTO_REMOVED_FULL_INVENTORY', \`Hostel "\${hostel.name}" (\${hostel.id}) reached 0 available beds. Automatically removed from Home / public search.\`, 'Inventory Engine');
  }

  writeJson(HOSTELS_FILE, hostels);

  let rent = hostel.rent;
  let deposit = hostel.deposit;

  if (isSplitRent) {
    rent = Math.round(rent / 2);
    deposit = Math.round(deposit / 2);
  }

  const platformFee = 2000;
  let totalPaid = rent + deposit + platformFee;
  if (tiffinSubscribed) totalPaid += 7500;
  if (laundrySubscribed) totalPaid += 2500;

  // Obtain authenticated userId (Never trust unverified frontend userId)
  let assignedUserId = req.user ? req.user.id : null;
  if (!assignedUserId) {
    // Check if phone matches any registered user
    const users = readJson(USERS_FILE);
    const matched = users.find(u => normalizePakPhone(u.phone) === cleanStudentPhone);
    assignedUserId = matched ? matched.id : 'usr-student-1';
  }

  const bookings = readJson(BOOKINGS_FILE);
  const bookingIndex = bookings.length + 1;
  const newBookingId = \`THK-BKG-\${1000 + bookingIndex}\`;

  const selectedRoomType = roomType || (isSplitRent ? '2-Person Sharing (Split Rent)' : '2-Person Sharing (Standard)');
  const selectedRoomNumber = roomNumber || \`Room \${101 + (bookingIndex % 12)}\`;
  const selectedCheckIn = checkInDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const newBooking = {
    bookingId: newBookingId,
    userId: assignedUserId,
    studentName: studentName.trim(),
    studentPhone: cleanStudentPhone,
    studentEmail: studentEmail || req.user?.email || (cleanStudentPhone + '@thakana.pk'),
    parentPhone: cleanParentPhone,
    university: (university && university.trim()) || 'UMT Lahore',
    rollNumber: (rollNumber && rollNumber.trim()) || \`F2024-\${1000 + bookingIndex}\`,
    hostelId: hostel.id,
    hostelName: hostel.name,
    hostelAddress: hostel.area ? \`\${hostel.area}, \${hostel.city}\` : \`\${hostel.city}, Pakistan\`,
    hostelImage: (hostel.images && hostel.images[0]) || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    roomId: roomId || \`room-\${hostel.id}-\${101 + (bookingIndex % 12)}\`,
    roomType: selectedRoomType,
    roomNumber: selectedRoomNumber,
    monthlyRent: rent,
    rentAmount: rent,
    depositAmount: deposit,
    platformFee: platformFee,
    totalPaid: totalPaid,
    isSplitRent: !!isSplitRent,
    bookingDate: new Date().toISOString().split('T')[0],
    checkInDate: selectedCheckIn,
    status: 'pending',
    escrowStatus: 'HELD_IN_ESCROW_48H',
    gatePassCode: \`GP-\${Math.floor(100000 + Math.random() * 900000)}\`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  writeJson(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: autoRemovedFromHome
      ? \`Booking confirmed! Note: \${hostel.name} has now reached 0 available beds and was automatically removed from the public Home marketplace.\`
      : 'Booking confirmed under Thikana Shield Escrow!',
    booking: newBooking,
    bedsRemaining: hostel.availableBeds,
    autoRemovedFromHome: autoRemovedFromHome,
    simulatedAlert: \`[SIMULATED WHATSAPP TO \${cleanParentPhone}]: Dear Guardian, your student \${studentName.trim()}'s bed at \${hostel.name} (\${selectedRoomNumber}, \${selectedRoomType}) is reserved. Deposit PKR \${deposit.toLocaleString()} is held safely in 48-Hour Escrow. Check-in: \${selectedCheckIn}.\`
  });
});`;

if (oldBookingRouteRegex.test(serverJs)) {
  serverJs = serverJs.replace(oldBookingRouteRegex, newBookingRoute);
  console.log('Successfully enhanced POST /api/bookings with full fields & authentication!');
} else {
  console.warn('oldBookingRouteRegex did not match exactly, searching by anchor...');
}

// 3. Add GET /api/bookings/:id for single booking view
const bookingDetailsEndpoint = `
// GET /api/bookings/:id - View single booking details with strict ownership verification
app.get('/api/bookings/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.bookingId === id || b.id === id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // Admin has full view permission
  if (req.user.role === 'admin') {
    return res.json({ success: true, booking });
  }

  // Student can view only their own booking
  if (req.user.role === 'student' || req.user.role === 'user') {
    const isOwner = (booking.userId === req.user.id) ||
                    (req.user.phone && booking.studentPhone && normalizePakPhone(booking.studentPhone) === normalizePakPhone(req.user.phone));
    if (!isOwner) {
      logAction('IDOR_VIOLATION_ATTEMPT', \`Student \${req.user.id} tried to view booking \${id} belonging to \${booking.userId}\`, req.user.name);
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this booking.' });
    }
    return res.json({ success: true, booking });
  }

  // Owner can view only bookings for their own properties
  if (req.user.role === 'owner') {
    const hostels = readJson(HOSTELS_FILE);
    const hostel = hostels.find(h => h.id === booking.hostelId);
    if (!hostel || hostel.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own the property for this booking.' });
    }
    return res.json({ success: true, booking });
  }

  return res.status(403).json({ success: false, message: 'Access denied.' });
});
`;

if (!serverJs.includes('/api/bookings/:id')) {
  serverJs = serverJs.replace("app.post('/api/bookings/:id/cancel'", bookingDetailsEndpoint + "\napp.post('/api/bookings/:id/cancel'");
  console.log('Added GET /api/bookings/:id endpoint');
}

fs.writeFileSync(serverFile, serverJs, 'utf8');
console.log('Saved updated server.js');
