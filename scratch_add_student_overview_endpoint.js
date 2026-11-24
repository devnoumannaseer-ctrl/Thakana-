const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let s = fs.readFileSync(serverFile, 'utf8');

// 1. Add /booking-details.html to dashboardAuthGuard
s = s.replace(
  "app.get(['/user-dashboard.html', '/user-dashboard'], dashboardAuthGuard('student'));",
  "app.get(['/user-dashboard.html', '/user-dashboard', '/booking-details.html', '/booking-details'], dashboardAuthGuard('student'));"
);

// 2. Add GET /api/student/dashboard-overview
const overviewEndpoint = `
// GET /api/student/dashboard-overview - Aggregated statistics & recommended hostels for Student Dashboard
app.get('/api/student/dashboard-overview', authenticate, authorize('student', 'user'), (req, res) => {
  const bookings = readJson(BOOKINGS_FILE);
  const hostels = readJson(HOSTELS_FILE);

  // Strictly isolate to authenticated student's own bookings: booking.userId === req.user.id
  const myBookings = bookings.filter(b => b.userId === req.user.id);

  // Sort by most recent booking date
  myBookings.sort((a, b) => new Date(b.bookingDate || b.createdAt || 0) - new Date(a.bookingDate || a.createdAt || 0));

  const total = myBookings.length;
  const pending = myBookings.filter(b => b.status === 'pending' || b.status === 'pending_owner_approval').length;
  const confirmed = myBookings.filter(b => b.status === 'confirmed' || b.status === 'approved').length;
  const cancelled = myBookings.filter(b => b.status === 'cancelled' || b.status === 'cancelled_by_student').length;

  const recentBookings = myBookings.slice(0, 3);

  // Recommended Hostels: approved, available beds > 0, not full
  const recommended = hostels
    .filter(h => (h.status === 'approved' || !h.status) && (Number(h.availableBeds) > 0) && !h.isFull)
    .slice(0, 4)
    .map(h => ({
      id: h.id,
      name: h.name,
      city: h.city,
      area: h.area,
      rent: h.rent,
      deposit: h.deposit,
      gender: h.gender,
      availableBeds: h.availableBeds,
      rating: h.rating || 4.8,
      reviewCount: h.reviewCount || 12,
      isVerified: (h.rating >= 4.5 || h.status === 'approved'),
      image: (h.images && h.images[0]) || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
    }));

  return res.json({
    success: true,
    stats: { total, pending, confirmed, cancelled },
    recentBookings,
    recommendedHostels: recommended
  });
});
`;

if (!s.includes('/api/student/dashboard-overview')) {
  s = s.replace("app.get('/api/user/my-bookings'", overviewEndpoint + "\napp.get('/api/user/my-bookings'");
  console.log('Added GET /api/student/dashboard-overview');
}

// 3. Ensure GET /api/bookings/:id strictly uses booking.userId === req.user.id for students
const oldIdorCheck = `if (req.user.role === 'student' || req.user.role === 'user') {
    const isOwner = (booking.userId === req.user.id) ||
                    (req.user.phone && booking.studentPhone && normalizePakPhone(booking.studentPhone) === normalizePakPhone(req.user.phone));
    if (!isOwner) {
      logAction('IDOR_VIOLATION_ATTEMPT', \`Student \${req.user.id} tried to view booking \${id} belonging to \${booking.userId}\`, req.user.name);
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this booking.' });
    }
    return res.json({ success: true, booking });
  }`;

const strictIdorCheck = `if (req.user.role === 'student' || req.user.role === 'user') {
    // Strict ownership rule: booking.userId === req.user.id
    if (booking.userId !== req.user.id) {
      logAction('IDOR_VIOLATION_ATTEMPT', \`Student \${req.user.id} tried to view booking \${id} belonging to \${booking.userId}\`, req.user.name);
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this booking.' });
    }
    return res.json({ success: true, booking });
  }`;

if (s.includes(oldIdorCheck)) {
  s = s.replace(oldIdorCheck, strictIdorCheck);
  console.log('Enforced strict booking.userId === req.user.id in GET /api/bookings/:id');
}

fs.writeFileSync(serverFile, s, 'utf8');
console.log('Saved server.js with student overview endpoint and strict IDOR check');
