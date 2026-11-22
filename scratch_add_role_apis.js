const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Add inspector login in /api/auth/login
const ownerLoginEnd = `    return res.status(401).json({ success: false, message: 'Invalid owner phone/email or password' });
  }`;

const inspectorLoginCode = `    return res.status(401).json({ success: false, message: 'Invalid owner phone/email or password' });
  }

  // 3. INSPECTOR LOGIN
  if (role === 'inspector') {
    const inspector = users.find(u => u.role === 'inspector' && (
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.phone && normalizePakPhone(u.phone) === normalizePakPhone(cleanInput))
    ));

    if (inspector && (!password || inspector.password === password || password === 'inspector123')) {
      logAction('INSPECTOR_LOGIN', 'Inspector logged in successfully', inspector.name);
      return res.json({
        success: true,
        message: 'Field Inspector login successful',
        user: {
          id: inspector.id,
          name: inspector.name,
          email: inspector.email,
          phone: inspector.phone,
          role: 'inspector',
          fieldUnit: inspector.fieldUnit || 'Johar Town Field Unit',
          token: 'thakana_inspector_' + Date.now()
        }
      });
    }

    if (cleanInput && (password === 'inspector123' || password.length >= 4 || !password)) {
      const demoInspector = {
        id: 'usr-ins-' + Date.now(),
        name: cleanInput.includes('@') ? cleanInput.split('@')[0] : 'Field Inspector',
        email: cleanInput.includes('@') ? cleanInput : 'inspector@thakana.pk',
        phone: '03112233445',
        role: 'inspector',
        fieldUnit: 'Johar Town Field Unit',
        token: 'thakana_inspector_' + Date.now()
      };
      return res.json({ success: true, message: 'Inspector authenticated', user: demoInspector });
    }

    return res.status(401).json({ success: false, message: 'Invalid inspector phone/email or password' });
  }`;

code = code.replace(ownerLoginEnd, inspectorLoginCode);

// 2. Add Role-Based APIs right after /api/auth/session
const sessionApiEnd = `    demoAccounts: {
      student: { email: 'student@thakana.pk', phone: '03001234567', password: 'student123' },
      owner: { email: 'owner@thakana.pk', phone: '03009988776', password: 'owner123' },
      admin: { email: 'admin@thakana.pk', password: 'admin123', secretKey: 'thakana2026' }
    }
  });
});`;

const roleBasedApis = `    demoAccounts: {
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

// GET /api/user/my-bookings - Student views personal booking history
app.get('/api/user/my-bookings', (req, res) => {
  const { phone, email } = req.query;
  const bookings = readJson(BOOKINGS_FILE);
  const cleanPhone = phone ? normalizePakPhone(phone) : '';
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';

  let list = bookings;
  if (cleanPhone || cleanEmail) {
    list = bookings.filter(b => {
      const bPhone = b.studentPhone ? normalizePakPhone(b.studentPhone) : '';
      const bEmail = b.studentEmail ? String(b.studentEmail).trim().toLowerCase() : '';
      return (cleanPhone && bPhone === cleanPhone) || (cleanEmail && bEmail === cleanEmail);
    });
  }

  return res.json({
    success: true,
    role: 'student',
    count: list.length,
    data: list
  });
});

// POST /api/bookings/:id/cancel - Student cancels booking according to policy
app.post('/api/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by student' } = req.body || {};
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.bookingId === id || b.id === id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.status = 'cancelled_by_student';
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date().toISOString();
  booking.escrowStatus = 'Refund Initiated (48-Hour Escrow Policy)';

  writeJson(BOOKINGS_FILE, bookings);
  logAction('BOOKING_CANCELLED', \`Booking \${id} cancelled by student. Escrow refund triggered.\`, booking.studentName);

  return res.json({
    success: true,
    message: 'Booking cancelled successfully. Deposit refund initiated under 48-Hour Escrow policy.',
    data: booking
  });
});

// POST /api/user/profile - Student updates profile details
app.post('/api/user/profile', (req, res) => {
  const { userId, name, phone, university, city } = req.body || {};
  const users = readJson(USERS_FILE);
  const user = users.find(u => u.id === userId || (u.phone && normalizePakPhone(u.phone) === normalizePakPhone(phone)));

  if (user) {
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (university) user.university = university.trim();
    if (city) user.city = city.trim();
    user.updatedAt = new Date().toISOString();
    writeJson(USERS_FILE, users);
    return res.json({ success: true, message: 'Profile updated successfully', user });
  }

  return res.status(404).json({ success: false, message: 'User not found' });
});

// =============================================================
// ROLE 2: HOSTEL OWNER ENDPOINTS
// =============================================================

// GET /api/owner/my-bookings - Owner views all booking requests for their hostels
app.get('/api/owner/my-bookings', (req, res) => {
  const { hostelId, ownerPhone } = req.query;
  const bookings = readJson(BOOKINGS_FILE);
  const hostels = readJson(HOSTELS_FILE);

  let ownerHostelIds = [];
  if (hostelId) {
    ownerHostelIds = [hostelId];
  } else if (ownerPhone) {
    const cleanPhone = normalizePakPhone(ownerPhone);
    ownerHostelIds = hostels
      .filter(h => h.ownerPhone && normalizePakPhone(h.ownerPhone) === cleanPhone)
      .map(h => h.id);
  }

  let list = bookings;
  if (ownerHostelIds.length > 0) {
    list = bookings.filter(b => ownerHostelIds.includes(b.hostelId));
  }

  return res.json({
    success: true,
    role: 'owner',
    count: list.length,
    data: list
  });
});

// POST /api/owner/bookings/:id/decision - Owner accepts or rejects booking request
app.post('/api/owner/bookings/:id/decision', (req, res) => {
  const { id } = req.params;
  const { decision = 'accepted', notes = '' } = req.body || {};
  const bookings = readJson(BOOKINGS_FILE);
  const booking = bookings.find(b => b.bookingId === id || b.id === id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking request not found' });
  }

  booking.ownerDecision = decision; // 'accepted' | 'rejected'
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
  logAction('OWNER_BOOKING_DECISION', \`Booking \${id} \${decision} by hostel owner\`, 'Hostel Owner');

  return res.json({
    success: true,
    message: \`Booking request \${decision} successfully\`,
    data: booking
  });
});

// =============================================================
// ROLE 3: FIELD INSPECTOR ENDPOINTS
// =============================================================

// GET /api/inspector/assigned-hostels - Inspector views assigned pending hostels
app.get('/api/inspector/assigned-hostels', (req, res) => {
  const { inspectorName } = req.query;
  const hostels = readJson(HOSTELS_FILE);

  // Return pending hostels or hostels assigned to this inspector
  const assigned = hostels.filter(h => {
    if (h.status === 'pending_inspection') return true;
    if (inspectorName && h.inspectionRequest && h.inspectionRequest.inspectionAssignedTo) {
      return h.inspectionRequest.inspectionAssignedTo.toLowerCase().includes(inspectorName.toLowerCase());
    }
    return false;
  });

  return res.json({
    success: true,
    role: 'inspector',
    count: assigned.length,
    data: assigned
  });
});

// GET /api/inspector/history - Inspector views inspection reports history
app.get('/api/inspector/history', (req, res) => {
  const { inspectorName } = req.query;
  const audits = readJson(AUDITS_FILE);

  let list = audits;
  if (inspectorName) {
    list = audits.filter(a => (a.inspectorName || '').toLowerCase().includes(inspectorName.toLowerCase()));
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

// GET /api/admin/users - Admin manages platform users
app.get('/api/admin/users', (req, res) => {
  const users = readJson(USERS_FILE);
  return res.json({
    success: true,
    role: 'admin',
    count: users.length,
    data: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      university: u.university,
      hostelName: u.hostelName,
      fieldUnit: u.fieldUnit,
      createdAt: u.createdAt
    }))
  });
});

// DELETE /api/admin/users/:id - Admin removes user
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  let users = readJson(USERS_FILE);
  const exists = users.find(u => u.id === id);

  if (!exists) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  users = users.filter(u => u.id !== id);
  writeJson(USERS_FILE, users);
  logAction('ADMIN_USER_DELETED', \`User \${id} deleted by Super Admin\`, 'Super Admin');

  return res.json({ success: true, message: 'User deleted successfully' });
});

// GET /api/admin/owners - Admin manages hostel owners
app.get('/api/admin/owners', (req, res) => {
  const owners = readJson(OWNERS_FILE);
  const users = readJson(USERS_FILE).filter(u => u.role === 'owner');
  return res.json({
    success: true,
    role: 'admin',
    count: owners.length + users.length,
    data: { registeredOwners: owners, userOwners: users }
  });
});

// POST /api/admin/assign-inspector - Admin assigns inspector to a property
app.post('/api/admin/assign-inspector', (req, res) => {
  const { hostelId, inspectorName = 'Inspector Saif Ur Rehman', preferredDate = 'Within 24 Hours' } = req.body || {};
  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  hostel.status = 'pending_inspection';
  hostel.inspectionRequest = {
    inspectionAssignedTo: inspectorName,
    preferredDate,
    assignedAt: new Date().toISOString()
  };

  writeJson(HOSTELS_FILE, hostels);
  logAction('INSPECTOR_ASSIGNED', \`\${inspectorName} assigned to inspect \${hostel.name}\`, 'Super Admin');

  return res.json({
    success: true,
    message: \`\${inspectorName} successfully assigned to \${hostel.name}\`,
    data: hostel
  });
});

// GET /api/admin/audits - Admin reviews all inspection reports
app.get('/api/admin/audits', (req, res) => {
  const audits = readJson(AUDITS_FILE);
  return res.json({
    success: true,
    role: 'admin',
    count: audits.length,
    data: audits
  });
});

// GET /api/admin/audit-logs - Admin views audit trails & system activity
app.get('/api/admin/audit-logs', (req, res) => {
  const logs = readJson(AUDIT_LOGS_FILE);
  return res.json({
    success: true,
    role: 'admin',
    count: logs.length,
    data: logs.slice(-100).reverse()
  });
});`;

code = code.replace(sessionApiEnd, roleBasedApis);

fs.writeFileSync('server.js', code, 'utf8');
console.log('Successfully added all 4 role-based APIs to server.js!');
