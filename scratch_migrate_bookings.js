const fs = require('fs');
const path = require('path');

const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const HOSTELS_FILE = path.join(__dirname, 'data', 'hostels.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

const bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
const hostels = JSON.parse(fs.readFileSync(HOSTELS_FILE, 'utf8'));
const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));

const studentUser = users.find(u => u.role === 'student') || { id: 'usr-student-1', email: 'student@thakana.pk', phone: '03001234567' };

// Normalize and backfill all bookings
const updatedBookings = bookings.map((b, index) => {
  const hostel = hostels.find(h => h.id === b.hostelId) || hostels[0];
  const roomTypes = ['2-Person Sharing (Standard)', '1-Seater Private Room', '3-Person Sharing (Budget)', '4-Person Dormitory'];
  const roomType = b.roomType || roomTypes[index % roomTypes.length];
  const roomNumber = b.roomNumber || `Room ${101 + (index % 12)}`;
  const rent = b.monthlyRent || b.rentAmount || hostel.rent || 25000;
  const deposit = b.depositAmount || hostel.deposit || Math.round(rent / 2);
  const bookingDate = b.bookingDate || b.createdAt || '2026-11-20';
  
  // Format check-in date
  let checkIn = b.checkInDate;
  if (!checkIn) {
    const d = new Date(bookingDate);
    d.setDate(d.getDate() + 3);
    checkIn = d.toISOString().split('T')[0];
  }

  // Normalize status
  let status = b.status || 'pending';
  if (status === 'pending_owner_approval') status = 'pending';
  if (status === 'confirmed') status = 'approved';

  return {
    bookingId: b.bookingId || `THK-BKG-${1000 + index + 1}`,
    userId: b.userId || studentUser.id,
    studentName: b.studentName || 'Student Resident',
    studentPhone: b.studentPhone || studentUser.phone,
    studentEmail: b.studentEmail || studentUser.email,
    parentPhone: b.parentPhone || '03219876543',
    university: b.university || 'UMT Lahore',
    rollNumber: b.rollNumber || `F2024-${1000 + index + 1}`,
    hostelId: hostel.id,
    hostelName: b.hostelName || hostel.name,
    hostelAddress: b.hostelAddress || (hostel.area ? `${hostel.area}, ${hostel.city}` : `${hostel.city}, Pakistan`),
    hostelImage: b.hostelImage || (hostel.images && hostel.images[0]) || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    roomId: b.roomId || `room-${hostel.id}-${101 + (index % 12)}`,
    roomType: roomType,
    roomNumber: roomNumber,
    monthlyRent: rent,
    rentAmount: rent,
    depositAmount: deposit,
    platformFee: b.platformFee || 2000,
    totalPaid: b.totalPaid || (rent + deposit + (b.platformFee || 2000)),
    isSplitRent: !!b.isSplitRent,
    bookingDate: bookingDate.split('T')[0],
    checkInDate: checkIn.split('T')[0],
    status: status, // 'pending', 'approved', 'rejected', 'cancelled', 'completed'
    escrowStatus: b.escrowStatus || 'Protected (Held in 48-Hour Escrow)',
    gatePassCode: b.gatePassCode || `GP-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: b.createdAt || new Date(bookingDate).toISOString(),
    updatedAt: new Date().toISOString()
  };
});

fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(updatedBookings, null, 2), 'utf8');
console.log(`Successfully migrated ${updatedBookings.length} booking records with complete data associations.`);
