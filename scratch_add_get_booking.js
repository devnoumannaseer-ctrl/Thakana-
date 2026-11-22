const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let s = fs.readFileSync(serverFile, 'utf8');

const target = "// POST /api/bookings/:id/cancel";

const getEndpoint = `// GET /api/bookings/:id - View single booking details with strict ownership verification
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

if (!s.includes("app.get('/api/bookings/:id'")) {
  s = s.replace(target, getEndpoint + target);
  fs.writeFileSync(serverFile, s, 'utf8');
  console.log('Successfully added GET /api/bookings/:id to server.js');
} else {
  console.log('GET /api/bookings/:id already present');
}
