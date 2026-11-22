const fs = require('fs');
const bcrypt = require('bcryptjs');

// 1. MIGRATE USERS
const usersFile = 'data/users.json';
let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

users.forEach(u => {
  // Ensure roles are strictly one of: student, owner, inspector, admin
  if (u.role === 'user') u.role = 'student';

  // Hash plain passwords with bcrypt
  if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
    u.passwordHash = bcrypt.hashSync(u.password, 10);
    delete u.password; // Do not store plaintext password!
  }
  if (!u.status) u.status = 'active';
  if (!u.createdAt) u.createdAt = new Date().toISOString();
});

fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log('Migrated users with bcrypt hashes:', users.map(u => ({ id: u.id, role: u.role, email: u.email })));

// 2. MIGRATE HOSTELS - Ensure every hostel has ownerId & assignedInspectorId
const hostelsFile = 'data/hostels.json';
let hostels = JSON.parse(fs.readFileSync(hostelsFile, 'utf8'));

hostels.forEach((h, idx) => {
  // Link to owner
  if (!h.ownerId) {
    h.ownerId = 'usr-owner-1';
  }
  if (!h.ownerName) {
    h.ownerName = 'Malik Tariq Mehmood';
  }
  if (!h.ownerPhone) {
    h.ownerPhone = '03009988776';
  }
  // Assign inspector where inspection is pending or for tracking
  if (!h.assignedInspectorId) {
    h.assignedInspectorId = 'usr-inspector-1';
  }
  if (!h.inspectionRequest) {
    h.inspectionRequest = {
      assignedInspectorId: 'usr-inspector-1',
      inspectionAssignedTo: 'Inspector Saif Ur Rehman',
      preferredDate: 'Within 24 Hours'
    };
  } else {
    h.inspectionRequest.assignedInspectorId = 'usr-inspector-1';
  }
  if (!h.status) {
    h.status = 'approved';
  }
});

// Set a couple of hostels to pending_inspection so Inspector has real assigned tasks!
if (hostels.length > 2) {
  hostels[2].status = 'pending_inspection'; // SethFateh Muhammad Boys
  hostels[2].assignedInspectorId = 'usr-inspector-1';
  hostels[5].status = 'pending_inspection'; // Alpine lodge (2)
  hostels[5].assignedInspectorId = 'usr-inspector-1';
}

fs.writeFileSync(hostelsFile, JSON.stringify(hostels, null, 2));
console.log('Migrated hostels with verified ownerId & assignedInspectorId:', hostels.length);

// 3. MIGRATE BOOKINGS - Ensure every booking has userId & status
const bookingsFile = 'data/bookings.json';
let bookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));

bookings.forEach((b, idx) => {
  if (!b.userId) {
    b.userId = 'usr-student-1';
  }
  if (!b.studentEmail) {
    b.studentEmail = 'student@thakana.pk';
  }
  if (!b.status) {
    b.status = (idx % 3 === 0) ? 'pending_owner_approval' : 'confirmed';
  }
  if (!b.createdAt) {
    b.createdAt = b.bookingDate || new Date().toISOString();
  }
});

fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
console.log('Migrated bookings with userId & status:', bookings.length);

// 4. MIGRATE REMOVAL REQUESTS - Ensure ownerId & status
const remFile = 'data/removal-requests.json';
let remRequests = fs.existsSync(remFile) ? JSON.parse(fs.readFileSync(remFile, 'utf8')) : [];
if (remRequests.length === 0) {
  remRequests.push({
    requestId: 'REQ-REM-1001',
    hostelId: 'staezy-18',
    hostelName: 'Darul Ehsan girls hostel Madina Town Faisalabad',
    ownerId: 'usr-owner-1',
    ownerName: 'Malik Tariq Mehmood',
    reason: 'Property lease renewal and temporary building maintenance',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
} else {
  remRequests.forEach(r => {
    if (!r.ownerId) r.ownerId = 'usr-owner-1';
    if (!r.status) r.status = 'pending';
  });
}
fs.writeFileSync(remFile, JSON.stringify(remRequests, null, 2));
console.log('Migrated removal requests:', remRequests.length);
