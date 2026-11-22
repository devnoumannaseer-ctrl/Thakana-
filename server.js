const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// File paths
const HOSTELS_FILE = path.join(__dirname, 'data', 'hostels.json');
const ROOMMATES_FILE = path.join(__dirname, 'data', 'roommates.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');
const PAIRINGS_FILE = path.join(__dirname, 'data', 'pairings.json');
const AUDITS_FILE = path.join(__dirname, 'data', 'audits.json');
const OWNERS_FILE = path.join(__dirname, 'data', 'owners.json');
const REMOVAL_REQUESTS_FILE = path.join(__dirname, 'data', 'removal-requests.json');
const INQUIRIES_FILE = path.join(__dirname, 'data', 'inquiries.json');
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'data', 'subscriptions.json');
const OFFERS_FILE = path.join(__dirname, 'data', 'offers.json');
const AUDIT_LOGS_FILE = path.join(__dirname, 'data', 'audit-logs.json');

// In-memory cache & Serverless Read-Only File System Resilient Store
const memoryStore = new Map();

// Helper to read JSON safely (with serverless /tmp & memory support)
function readJson(file) {
  if (memoryStore.has(file)) {
    return JSON.parse(JSON.stringify(memoryStore.get(file)));
  }
  // Check /tmp first for Vercel serverless persistence across warm lambdas
  try {
    const tmpFile = path.join('/tmp', path.basename(file));
    if (fs.existsSync(tmpFile)) {
      const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
      memoryStore.set(file, data);
      return data;
    }
  } catch (e) {}

  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    memoryStore.set(file, data);
    return data;
  } catch (err) {
    return [];
  }
}

// Helper to write JSON safely (survives Vercel EROFS read-only filesystem)
function writeJson(file, data) {
  memoryStore.set(file, data);
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // If running in read-only environment (e.g. Vercel), write to /tmp
    try {
      const tmpFile = path.join('/tmp', path.basename(file));
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (tmpErr) {
      // In-memory fallback will handle warm invocations
    }
  }
}

// Audit Logger
function logAction(action, details, performedBy = 'System') {
  try {
    const logs = readJson(AUDIT_LOGS_FILE);
    logs.push({
      logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      performedBy,
      timestamp: new Date().toISOString()
    });
    writeJson(AUDIT_LOGS_FILE, logs.slice(-500));
  } catch (e) {
    console.warn('Audit log write error:', e.message);
  }
}

// Normalize Pakistani phone number to standard 11 digits (03XXXXXXXXX)
function normalizePakPhone(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/[\s\-\+\(\)]/g, '');
  if (clean.startsWith('923') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  } else if (clean.startsWith('3') && clean.length === 10) {
    clean = '0' + clean;
  }
  return clean;
}

// Phone validator for Pakistani numbers
function isValidPakPhone(phone) {
  if (!phone) return false;
  const clean = normalizePakPhone(phone);
  return /^03\d{9}$/.test(clean);
}

// -------------------------------------------------------------
// 1. GET /api/hostels - Public Marketplace Search (ONLY APPROVED & AVAILABLE HOSTELS)
// -------------------------------------------------------------
app.get('/api/hostels', (req, res) => {
  let hostels = readJson(HOSTELS_FILE);
  const { gender, uni, minPrice, maxPrice, search } = req.query;

  // IMPORTANT:
  // 1. Must be approved
  // 2. Must not be removed by Admin (isArchived/removed)
  // 3. Must NOT be fully occupied: If availableBeds <= 0, automatically removed from public marketplace!
  hostels = hostels.filter(h => {
    if (h.status === 'removed' || h.isArchived || h.isRemoved) return false;
    if (h.status === 'fully_occupied' || h.isFull === true) return false;
    const beds = (h.availableBeds !== undefined) ? Number(h.availableBeds) : 1;
    if (beds <= 0) return false;
    return h.status === 'approved' || (!h.status && (h.verificationScore || 0) >= 80);
  });

  if (gender && gender !== 'all') {
    hostels = hostels.filter(h => h.gender.toLowerCase() === gender.toLowerCase());
  }

  if (uni && uni !== 'all') {
    hostels = hostels.filter(h => {
      const primaryMatch = h.proximity && h.proximity.primary && h.proximity.primary.toLowerCase().includes(uni.toLowerCase());
      const otherMatch = h.proximity && h.proximity.otherUnis && h.proximity.otherUnis.some(u => u.toLowerCase().includes(uni.toLowerCase()));
      return primaryMatch || otherMatch;
    });
  }

  // Proper budget filtering
  if (minPrice && !isNaN(parseInt(minPrice))) {
    hostels = hostels.filter(h => h.rent >= parseInt(minPrice));
  }

  if (maxPrice && !isNaN(parseInt(maxPrice))) {
    hostels = hostels.filter(h => h.rent <= parseInt(maxPrice));
  }

  if (search) {
    const s = search.toLowerCase().trim();
    hostels = hostels.filter(h =>
      (h.name && h.name.toLowerCase().includes(s)) ||
      (h.area && h.area.toLowerCase().includes(s)) ||
      (h.proximity && h.proximity.primary && h.proximity.primary.toLowerCase().includes(s))
    );
  }

  res.json({
    success: true,
    count: hostels.length,
    data: hostels
  });
});

// -------------------------------------------------------------
// 2. GET /api/hostels/:id - Detailed single hostel
// -------------------------------------------------------------
app.get('/api/hostels/:id', (req, res) => {
  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === req.params.id);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found' });
  }

  res.json({ success: true, data: hostel });
});

// -------------------------------------------------------------
// 3. POST /api/bookings - Bed Reservation with Validation & Inventory Decrement
// -------------------------------------------------------------
app.post('/api/bookings', (req, res) => {
  const {
    hostelId,
    studentName,
    studentPhone,
    parentPhone,
    university,
    rollNumber,
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
    // If not standard 11 digits, fallback if has at least 7 digits, else demo default
    cleanStudentPhone = cleanStudentPhone.length >= 7 ? `0300${cleanStudentPhone.slice(-7)}` : '03001234567';
  }

  let cleanParentPhone = normalizePakPhone(parentPhone);
  if (!isValidPakPhone(cleanParentPhone) || cleanParentPhone === cleanStudentPhone) {
    cleanParentPhone = '03219876543'; // Safe parent guardian demo fallback
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
      message: `Sorry, ${hostel.name} is currently fully occupied. Beds are sold out and property has been auto-removed from the public home page.`
    });
  }

  // Decrement Bed Count & Run Space Check
  hostel.availableBeds = currentBeds - 1;
  let autoRemovedFromHome = false;

  if (hostel.availableBeds <= 0) {
    hostel.availableBeds = 0;
    hostel.status = 'fully_occupied'; // Marks fully occupied
    hostel.isFull = true;
    hostel.autoRemovedAt = new Date().toISOString();
    autoRemovedFromHome = true;
    logAction('AUTO_REMOVED_FULL_INVENTORY', `Hostel "${hostel.name}" (${hostel.id}) reached 0 available beds. Automatically removed from Home / public search.`, 'Inventory Engine');
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

  const bookings = readJson(BOOKINGS_FILE);
  const newBooking = {
    bookingId: `THK-BKG-${1000 + bookings.length + 1}`,
    hostelId: hostel.id,
    hostelName: hostel.name,
    studentName: studentName.trim(),
    studentPhone: cleanStudentPhone,
    parentPhone: cleanParentPhone,
    university: (university && university.trim()) || 'UMT Lahore',
    rollNumber: (rollNumber && rollNumber.trim()) || `F2024-${1000 + bookings.length + 1}`,
    rentAmount: rent,
    depositAmount: deposit,
    platformFee: platformFee,
    tiffinSubscribed: !!tiffinSubscribed,
    laundrySubscribed: !!laundrySubscribed,
    totalPaid: totalPaid,
    isSplitRent: !!isSplitRent,
    escrowStatus: 'HELD_IN_ESCROW_48H',
    bookingDate: new Date().toISOString(),
    gatePassCode: `GP-${Math.floor(100000 + Math.random() * 900000)}`
  };

  bookings.push(newBooking);
  writeJson(BOOKINGS_FILE, bookings);

  res.status(201).json({
    success: true,
    message: autoRemovedFromHome
      ? `Booking confirmed! Note: ${hostel.name} has now reached 0 available beds and was automatically removed from the public Home marketplace.`
      : 'Booking confirmed under Thikana Shield Escrow!',
    booking: newBooking,
    bedsRemaining: hostel.availableBeds,
    autoRemovedFromHome: autoRemovedFromHome,
    simulatedAlert: `[SIMULATED WHATSAPP TO ${cleanParentPhone}]: Dear Guardian, your student ${studentName.trim()}'s bed at ${hostel.name} is reserved. Deposit PKR ${deposit.toLocaleString()} is held safely in 48-Hour Escrow. 7-Day Free Room Swap active.`
  });
});

// -------------------------------------------------------------
// 4. POST /api/roommate-match - AI Vector Compatibility Matching
// -------------------------------------------------------------
app.post('/api/roommate-match', (req, res) => {
  const { gender, sleepCycle, studyAtmosphere, cleanlinessIndex, major } = req.body;
  const roommates = readJson(ROOMMATES_FILE);

  let candidatePool = roommates;
  if (gender && gender !== 'all') {
    candidatePool = candidatePool.filter(r => r.gender.toLowerCase() === gender.toLowerCase());
  }

  const matches = candidatePool.map(cand => {
    let score = 70;
    if (cand.sleepSchedule && sleepCycle && cand.sleepSchedule.toLowerCase().includes(sleepCycle.toLowerCase())) score += 12;
    if (cand.studyHabits && studyAtmosphere && cand.studyHabits.toLowerCase().includes(studyAtmosphere.toLowerCase())) score += 10;
    if (cleanlinessIndex && cand.cleanlinessRating >= parseInt(cleanlinessIndex)) score += 5;
    if (major && cand.degree && cand.degree.toLowerCase().includes(major.toLowerCase())) score += 3;

    return {
      ...cand,
      matchPercentage: Math.min(score, 99)
    };
  });

  matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

  res.json({
    success: true,
    count: matches.length,
    matches: matches
  });
});

// -------------------------------------------------------------
// 5. POST /api/roommate-pair - Coordination Request
// -------------------------------------------------------------
app.post('/api/roommate-pair', (req, res) => {
  const { candidateId, requesterName, requesterPhone, requesterUni, requesterRoll } = req.body;

  if (!candidateId || !requesterName || !requesterPhone) {
    return res.status(400).json({ success: false, message: 'Please provide candidate ID, your name, and mobile number.' });
  }

  if (!isValidPakPhone(requesterPhone)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid Pakistani mobile number (03XXXXXXXXX).' });
  }

  const roommates = readJson(ROOMMATES_FILE);
  const target = roommates.find(r => r.id === candidateId);

  if (!target) {
    return res.status(404).json({ success: false, message: 'Target roommate profile not found.' });
  }

  const pairings = readJson(PAIRINGS_FILE);
  const newPairing = {
    pairId: `THK-PAIR-${1000 + pairings.length + 1}`,
    targetStudentId: target.id,
    targetStudentName: target.name,
    targetUniversity: target.university,
    requesterName: requesterName.trim(),
    requesterPhone: requesterPhone.trim(),
    requesterUni: (requesterUni && requesterUni.trim()) || 'Lahore Campus',
    requesterRoll: (requesterRoll && requesterRoll.trim()) || 'Verified In-Process',
    status: 'Pairing Coordinated (WhatsApp Intro Dispatched)',
    swapGuarantee: '7-Day Free Room Swap Enabled',
    createdAt: new Date().toISOString()
  };

  pairings.push(newPairing);
  writeJson(PAIRINGS_FILE, pairings);

  res.status(201).json({
    success: true,
    message: `Pairing request created! You have been connected with ${target.name}.`,
    pairing: newPairing,
    whatsappNotice: `[SIMULATED WHATSAPP TO ${requesterPhone} & ${target.name}]: Assalam-o-Alaikum! Thikana Coordinator has connected you for mutual room-share at Johar Town. Your 7-Day Free Swap Guarantee is active.`
  });
});

// -------------------------------------------------------------
// 6. POST /api/owner/register-hostel - Owner Registration & Hostel Submission (Pending Inspection)
// -------------------------------------------------------------
app.post('/api/owner/register-hostel', (req, res) => {
  const {
    ownerName,
    ownerPhone,
    ownerEmail,
    ownerCnic,
    hostelName,
    gender,
    area,
    address,
    primaryUni,
    distanceMeters,
    walkMinutes,
    rent,
    deposit,
    totalRooms,
    totalBeds,
    availableBeds,
    amenities,
    description,
    images,
    preferredInspectionDate
  } = req.body;

  // Validation
  if (!ownerName || ownerName.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Owner name must be at least 3 characters.' });
  }
  if (!isValidPakPhone(ownerPhone)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid Pakistani mobile number for the owner.' });
  }
  if (!hostelName || hostelName.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Hostel name must be at least 3 characters.' });
  }
  if (!rent || isNaN(Number(rent)) || Number(rent) <= 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid monthly rent amount.' });
  }

  const hostels = readJson(HOSTELS_FILE);
  const owners = readJson(OWNERS_FILE);

  // Save/Update Owner record
  let ownerRecord = owners.find(o => o.phone === ownerPhone.trim());
  if (!ownerRecord) {
    ownerRecord = {
      ownerId: `THK-OWN-${100 + owners.length + 1}`,
      name: ownerName.trim(),
      phone: ownerPhone.trim(),
      email: ownerEmail ? ownerEmail.trim() : '',
      cnic: ownerCnic ? ownerCnic.trim() : 'Verified In-Person',
      registeredAt: new Date().toISOString()
    };
    owners.push(ownerRecord);
    writeJson(OWNERS_FILE, owners);
  }

  // Automatic 30-Day Free Trial Provisioning for Verified Pro (PKR 999 Value)
  const subscriptions = readJson(SUBSCRIPTIONS_FILE);
  let ownerSub = subscriptions.find(s => s.ownerPhone === ownerPhone.trim());
  if (!ownerSub) {
    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    ownerSub = {
      subscriptionId: `SUB-TRIAL-${1000 + subscriptions.length + 1}`,
      ownerId: ownerRecord.ownerId,
      ownerPhone: ownerPhone.trim(),
      ownerName: ownerName.trim(),
      plan: 'professional',
      planName: 'Verified Pro (30-Day Free Trial)',
      monthlyPricePkr: 0,
      regularPricePkr: 999,
      isTrial: true,
      trialDays: 30,
      status: 'active',
      validUntil: trialEnd,
      features: [
        '30-Day Free Trial Active (Saving PKR 999)',
        'Up to 3 Hostel Listings Included',
        'Verified Gold Quality Badge Priority',
        'WhatsApp Instant Alert Leads',
        'Full Inquiries & Analytics Access'
      ]
    };
    subscriptions.push(ownerSub);
    writeJson(SUBSCRIPTIONS_FILE, subscriptions);
    logAction('OWNER_TRIAL_ACTIVATED', `30-Day Verified Pro trial activated for ${ownerName.trim()} (${ownerPhone.trim()})`, 'Thikana System');
  }

  // Generate unique hostel ID
  const newHostelId = `thk-h-${String(hostels.length + 1).padStart(3, '0')}`;

  const defaultPhoto = gender === 'Female'
    ? 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80'
    : 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80';

  const newHostel = {
    id: newHostelId,
    name: hostelName.trim(),
    gender: gender || 'Female',
    area: area ? area.trim() : 'Johar Town',
    city: 'Lahore',
    address: address ? address.trim() : `${area || 'Johar Town'}, Lahore`,
    proximity: {
      primary: primaryUni || 'UMT Lahore',
      distanceMeters: Number(distanceMeters) || 500,
      walkMinutes: Number(walkMinutes) || 6,
      otherUnis: []
    },
    rent: Number(rent),
    deposit: Number(deposit) || Math.round(Number(rent) * 0.5),
    rating: 5.0,
    reviewCount: 0,
    verificationScore: null,
    verifiedDate: null,
    status: 'pending_inspection', // STAGE: PENDING INSPECTION
    images: Array.isArray(images) && images.length > 0 ? images : [defaultPhoto],
    sensoryMetrics: {
      waterTdsPpm: null,
      waterRating: 'Pending Physical Audit',
      noiseDecibels: null,
      noiseRating: 'Pending Physical Audit',
      generatorLoad: 'Pending Test'
    },
    amenities: Array.isArray(amenities) && amenities.length > 0 ? amenities : ['100 Mbps WiFi', '24/7 Generator', 'Attached Bath'],
    warden: {
      name: 'To be verified during inspection',
      experienceYears: 0,
      cnicVerified: false,
      policeVerification: 'Pending Inspection Audit',
      phone: ownerPhone.trim()
    },
    escrowProtected: true,
    swapGuarantee: true,
    description: description || `Premium verified student residence for students. Managed under Thikana 48-Hour Deposit Escrow.`,
    totalRooms: Number(totalRooms) || 8,
    totalBeds: Number(totalBeds) || 24,
    availableBeds: Number(availableBeds) || Number(totalBeds) || 24,
    owner: {
      ownerId: ownerRecord.ownerId,
      name: ownerName.trim(),
      phone: ownerPhone.trim(),
      email: ownerEmail || '',
      cnic: ownerCnic || ''
    },
    inspectionRequest: {
      preferredDate: preferredInspectionDate || 'Within 48 hours',
      submittedAt: new Date().toISOString(),
      inspectionAssignedTo: 'Inspector Saif Ur Rehman (Johar Town Field Unit)'
    },
    createdAt: new Date().toISOString()
  };

  hostels.push(newHostel);
  writeJson(HOSTELS_FILE, hostels);

  res.status(201).json({
    success: true,
    message: 'Hostel registered successfully! Status is set to "Pending Inspection". Thikana Field Team has been notified.',
    hostel: newHostel
  });
});

// -------------------------------------------------------------
// 7. GET /api/admin/hostels - All Hostels with Lifecycle Statuses for Admin
// -------------------------------------------------------------
app.get('/api/admin/hostels', (req, res) => {
  const hostels = readJson(HOSTELS_FILE);
  const audits = readJson(AUDITS_FILE);

  res.json({
    success: true,
    totalCount: hostels.length,
    counts: {
      pendingInspection: hostels.filter(h => h.status === 'pending_inspection').length,
      inspected: hostels.filter(h => h.status === 'inspected').length,
      approved: hostels.filter(h => (h.status === 'approved' || (!h.status && (h.verificationScore || 0) >= 80)) && !h.isArchived && h.status !== 'removed' && h.status !== 'fully_occupied' && (h.availableBeds > 0 || h.availableBeds === undefined)).length,
      removed: hostels.filter(h => h.status === 'removed' || h.isArchived === true || h.isRemoved === true).length,
      fullyOccupied: hostels.filter(h => (h.status === 'fully_occupied' || (h.availableBeds !== undefined && h.availableBeds <= 0)) && h.status !== 'removed' && !h.isArchived).length,
      rejected: hostels.filter(h => h.status === 'rejected').length
    },
    data: hostels,
    recentAudits: audits.slice(-5)
  });
});

// -------------------------------------------------------------
// 8. POST /api/admin/approve-hostel - Admin Approval / Rejection
// -------------------------------------------------------------
app.post('/api/admin/approve-hostel', (req, res) => {
  const { hostelId, action, adminNotes, adminName } = req.body;

  if (!hostelId || !action) {
    return res.status(400).json({ success: false, message: 'Hostel ID and action (approve / reject) are required.' });
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found.' });
  }

  if (action === 'approve') {
    hostel.status = 'approved';
    hostel.adminApproval = {
      approvedBy: adminName || 'Admin Saif / Nauman / Rohan',
      approvedAt: new Date().toISOString(),
      notes: adminNotes || 'Approved for public marketplace listing under Thikana Shield.'
    };
    if (!hostel.verificationScore) {
      hostel.verificationScore = 94; // Default high pass score if approved
    }
  } else if (action === 'reject') {
    hostel.status = 'rejected';
    hostel.adminApproval = {
      rejectedBy: adminName || 'Admin Team',
      rejectedAt: new Date().toISOString(),
      rejectionReason: adminNotes || 'Does not meet Thikana sensory or security requirements.'
    };
  } else {
    return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
  }

  writeJson(HOSTELS_FILE, hostels);

  res.json({
    success: true,
    message: action === 'approve'
      ? `Hostel "${hostel.name}" has been Approved and is now LIVE on the public marketplace!`
      : `Hostel "${hostel.name}" has been rejected.`,
    hostel: hostel
  });
});

// -------------------------------------------------------------
// 9. POST /api/audit-submit - Real Inspector 50-Point Physical Audit
// -------------------------------------------------------------
app.post('/api/audit-submit', (req, res) => {
  const {
    hostelId,
    hostelName,
    inspectorName,
    gpsLatitude,
    gpsLongitude,
    waterTdsPpm,
    noiseDecibels,
    cctvCount,
    wardenCnicVerified,
    generatorLoadVerified,
    escrowAgreementSigned
  } = req.body;

  const tds = parseInt(waterTdsPpm);
  const noise = parseInt(noiseDecibels);
  const cctv = parseInt(cctvCount);

  if (isNaN(tds) || isNaN(noise) || isNaN(cctv)) {
    return res.status(400).json({ success: false, message: 'Please provide valid numerical readings for TDS, Noise, and CCTV count.' });
  }

  // Exact Mathematical Scoring Formula out of 100
  let score = 0;
  if (tds <= 120) score += 25;
  else if (tds <= 140) score += 20;
  else if (tds <= 180) score += 10;

  if (noise <= 35) score += 25;
  else if (noise <= 40) score += 20;
  else if (noise <= 45) score += 10;

  if (cctv >= 16) score += 15;
  else if (cctv >= 10) score += 10;
  else score += 5;

  if (wardenCnicVerified) score += 15;
  if (generatorLoadVerified) score += 10;
  if (escrowAgreementSigned) score += 10;

  const badge = score >= 90 ? 'THIKANA VERIFIED GOLD' : (score >= 75 ? 'THIKANA VERIFIED SILVER' : 'CONDITIONAL RE-AUDIT');

  const hostels = readJson(HOSTELS_FILE);
  let matchedHostel = null;

  if (hostelId) {
    matchedHostel = hostels.find(h => h.id === hostelId);
  } else if (hostelName) {
    matchedHostel = hostels.find(h => h.name.toLowerCase().includes(hostelName.toLowerCase().trim()));
  }

  if (matchedHostel) {
    matchedHostel.verificationScore = score;
    matchedHostel.verifiedDate = new Date().toISOString().split('T')[0];
    matchedHostel.sensoryMetrics = {
      waterTdsPpm: tds,
      waterRating: tds <= 120 ? 'Pure Mineral RO' : (tds <= 140 ? 'Safe Standard' : 'Requires Filtration'),
      noiseDecibels: noise,
      noiseRating: noise <= 36 ? 'Pin-Drop Silent Study' : 'Quiet Residential',
      generatorLoad: generatorLoadVerified ? 'Heavy Generator (Full AC Load Verified)' : 'UPS Backup Only'
    };
    
    // Transition status to "inspected" (awaiting admin approval) if it was pending
    if (matchedHostel.status === 'pending_inspection') {
      matchedHostel.status = 'inspected';
    }
    
    writeJson(HOSTELS_FILE, hostels);
  }

  const audits = readJson(AUDITS_FILE);
  const auditRecord = {
    auditId: `AUD-${Date.now()}`,
    hostelId: (matchedHostel && matchedHostel.id) || hostelId || 'unknown',
    hostelName: (matchedHostel && matchedHostel.name) || hostelName || 'Lahore Student Residency',
    inspector: inspectorName || 'Inspector Saif & Ground Team',
    gpsLocation: {
      latitude: gpsLatitude || 31.4697,
      longitude: gpsLongitude || 74.2728,
      verifiedWithin20m: true
    },
    metrics: { tds, noise, cctv, wardenCnicVerified: !!wardenCnicVerified, generatorLoadVerified: !!generatorLoadVerified, escrowAgreementSigned: !!escrowAgreementSigned },
    score: score,
    badgeAwarded: badge,
    timestamp: new Date().toISOString()
  };

  audits.push(auditRecord);
  writeJson(AUDITS_FILE, audits);

  res.status(201).json({
    success: true,
    message: `50-Point Audit Complete. Score: ${score}/100. Status updated to "Inspected (Awaiting Admin Approval)".`,
    auditReport: auditRecord,
    updatedHostel: matchedHostel
  });
});

// -------------------------------------------------------------
// 10. GET /api/student-pass/:query - Dynamic Student Pass Lookup
// -------------------------------------------------------------
app.get('/api/student-pass/:query', (req, res) => {
  const query = req.params.query.toLowerCase().trim();
  const bookings = readJson(BOOKINGS_FILE);

  const matched = bookings.find(b =>
    (b.rollNumber && b.rollNumber.toLowerCase().includes(query)) ||
    (b.bookingId && b.bookingId.toLowerCase().includes(query)) ||
    (b.studentName && b.studentName.toLowerCase().includes(query))
  );

  if (matched) {
    return res.json({
      success: true,
      found: true,
      pass: {
        studentName: matched.studentName,
        university: matched.university,
        rollNumber: matched.rollNumber,
        hostelName: matched.hostelName,
        bookingId: matched.bookingId,
        validThru: 'Fall 2025 Semester',
        status: 'ACTIVE VERIFIED PASS'
      }
    });
  }

  res.json({
    success: true,
    found: false,
    pass: {
      studentName: 'Ayesha Tariq',
      university: 'University of Management and Technology (UMT)',
      rollNumber: 'F2024-DPT-042',
      hostelName: 'Al-Rehman Executive Female Residency',
      bookingId: 'THK-BKG-1001',
      validThru: 'Fall 2025 Semester',
      status: 'DEMO RESIDENT PASS'
    }
  });
});

// -------------------------------------------------------------
// 11. POST /api/parent-alert-simulation - Real-Time WhatsApp Alert Dispatch
// -------------------------------------------------------------
app.post('/api/parent-alert-simulation', (req, res) => {
  const { studentName, parentPhone, hostelName, time } = req.body;
  const checkInTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const alertMessage = `Assalam-o-Alaikum. THIKANA PARENT SAFETY UPDATE: Your student ${studentName || 'Ayesha Tariq'} checked in through the biometric gate at ${hostelName || 'Al-Rehman Executive Female Residency'} safely at ${checkInTime}. Emergency Johar Town Hotline: 042-3591-8822.`;

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    recipient: parentPhone || '0321-9876543',
    message: alertMessage
  });
});

// -------------------------------------------------------------
// 12. GET /api/stats - Real-Time Database Metrics
// -------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  const hostels = readJson(HOSTELS_FILE);
  const bookings = readJson(BOOKINGS_FILE);
  const pairings = readJson(PAIRINGS_FILE);
  const audits = readJson(AUDITS_FILE);

  const approvedHostels = hostels.filter(h => h.status === 'approved' || (!h.status && h.verificationScore >= 80));
  const pendingInspectionHostels = hostels.filter(h => h.status === 'pending_inspection');
  const inspectedHostels = hostels.filter(h => h.status === 'inspected');

  const totalBeds = approvedHostels.reduce((sum, h) => sum + (h.totalBeds || 30), 0);
  const availableBeds = approvedHostels.reduce((sum, h) => sum + (h.availableBeds || 0), 0);
  const occupiedBeds = totalBeds - availableBeds;
  const totalEscrowPkr = bookings.reduce((sum, b) => sum + (b.depositAmount || 0), 0);

  const avgScore = approvedHostels.length > 0
    ? Math.round((approvedHostels.reduce((sum, h) => sum + (h.verificationScore || 90), 0) / approvedHostels.length) * 10) / 10
    : 95.0;

  res.json({
    success: true,
    metrics: {
      verifiedHostelsCount: approvedHostels.length,
      pendingInspectionCount: pendingInspectionHostels.length,
      inspectedCount: inspectedHostels.length,
      totalRegisteredCount: hostels.length,
      totalBeds: totalBeds,
      availableBeds: availableBeds,
      occupiedBeds: occupiedBeds,
      activeBookings: bookings.length,
      escrowFundsGuaranteedPkr: totalEscrowPkr,
      averageQualityScore: avgScore,
      pairingsCoordinated: pairings.length,
      auditsLogged: audits.length,
      swapSatisfactionRate: '100% (7-Day Swap Active)'
    }
  });
});

// -------------------------------------------------------------
// 13. POST /api/owner/removal-request - Owner Submits Removal Request
// -------------------------------------------------------------
app.post('/api/owner/removal-request', (req, res) => {
  const { hostelId, reason, ownerPhone } = req.body;

  if (!hostelId || !reason || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid hostel ID and a detailed reason for removal (at least 5 characters).'
    });
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found in system.' });
  }

  // Check active bookings count
  const bookings = readJson(BOOKINGS_FILE);
  const activeBookings = bookings.filter(b => b.hostelId === hostelId);

  const removalRequests = readJson(REMOVAL_REQUESTS_FILE);

  // Check if there is already a pending removal request
  const existingPending = removalRequests.find(r => r.hostelId === hostelId && r.status === 'pending');
  if (existingPending) {
    return res.status(400).json({
      success: false,
      message: 'A removal request for this property is already pending Executive Admin review.',
      requestId: existingPending.requestId
    });
  }

  const newRequest = {
    requestId: `REM-${1000 + removalRequests.length + 1}`,
    hostelId: hostel.id,
    hostelName: hostel.name,
    ownerId: hostel.owner?.ownerId || 'OWN-UNKNOWN',
    ownerName: hostel.owner?.name || 'Partner Host',
    ownerPhone: (ownerPhone && ownerPhone.trim()) || hostel.owner?.phone || '0300...',
    reason: reason.trim(),
    status: 'pending', // pending -> approved (removed) | rejected
    requestedAt: new Date().toISOString(),
    adminDecision: {
      decidedBy: null,
      decidedAt: null,
      decisionNotes: null
    },
    activeBookingsCount: activeBookings.length
  };

  removalRequests.push(newRequest);
  writeJson(REMOVAL_REQUESTS_FILE, removalRequests);

  // Mark removalPending flag on hostel
  hostel.removalPending = true;
  writeJson(HOSTELS_FILE, hostels);

  logAction('OWNER_REMOVAL_REQUESTED', `Removal requested for ${hostel.name} (${hostel.id}): ${reason.trim()}`, newRequest.ownerName);

  res.status(201).json({
    success: true,
    message: `Removal request for "${hostel.name}" submitted! Status is pending Executive Admin review.`,
    request: newRequest
  });
});

// -------------------------------------------------------------
// 14. GET /api/owner/removal-requests - Owner Views Removal Requests
// -------------------------------------------------------------
app.get('/api/owner/removal-requests', (req, res) => {
  const { phone, hostelId } = req.query;
  let requests = readJson(REMOVAL_REQUESTS_FILE);

  if (phone) {
    requests = requests.filter(r => r.ownerPhone.includes(phone.trim()));
  }
  if (hostelId) {
    requests = requests.filter(r => r.hostelId === hostelId);
  }

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// -------------------------------------------------------------
// 15. GET /api/admin/removal-requests - Admin Views All Removal Requests
// -------------------------------------------------------------
app.get('/api/admin/removal-requests', (req, res) => {
  const requests = readJson(REMOVAL_REQUESTS_FILE);
  const hostels = readJson(HOSTELS_FILE);
  const bookings = readJson(BOOKINGS_FILE);

  const enriched = requests.map(r => {
    const h = hostels.find(x => x.id === r.hostelId);
    const activeB = bookings.filter(b => b.hostelId === r.hostelId).length;
    return {
      ...r,
      currentHostelStatus: h ? h.status : 'unknown',
      activeBookingsCount: activeB,
      hostelArea: h ? h.area : 'Johar Town',
      hostelRent: h ? h.rent : 0
    };
  });

  res.json({
    success: true,
    totalCount: enriched.length,
    counts: {
      pending: enriched.filter(r => r.status === 'pending').length,
      approved: enriched.filter(r => r.status === 'approved').length,
      rejected: enriched.filter(r => r.status === 'rejected').length
    },
    data: enriched
  });
});

// -------------------------------------------------------------
// 16. POST /api/admin/removal-requests/:requestId/decision - Admin Approves or Rejects Removal
// -------------------------------------------------------------
app.post('/api/admin/removal-requests/:requestId/decision', (req, res) => {
  const { requestId } = req.params;
  const { action, decisionNotes, adminName } = req.body;

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Decision action must be "approve" or "reject".' });
  }

  const removalRequests = readJson(REMOVAL_REQUESTS_FILE);
  const reqItem = removalRequests.find(r => r.requestId === requestId);

  if (!reqItem) {
    return res.status(404).json({ success: false, message: 'Removal request not found.' });
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === reqItem.hostelId);

  const adminUser = adminName || 'Admin Executive';

  if (action === 'approve') {
    // 1. Mark request approved
    reqItem.status = 'approved';
    reqItem.adminDecision = {
      decidedBy: adminUser,
      decidedAt: new Date().toISOString(),
      decisionNotes: decisionNotes || 'Removal request approved. Property soft-deleted from public marketplace.'
    };

    // 2. Soft-delete property (preserve history for past escrow records)
    if (hostel) {
      hostel.status = 'removed';
      hostel.isArchived = true;
      hostel.archivedAt = new Date().toISOString();
      hostel.removalPending = false;
      hostel.removalReason = reqItem.reason;
      writeJson(HOSTELS_FILE, hostels);
    }

    logAction('ADMIN_REMOVAL_APPROVED', `Removal approved for ${reqItem.hostelName} (${reqItem.hostelId}). Soft-deleted from marketplace.`, adminUser);

    writeJson(REMOVAL_REQUESTS_FILE, removalRequests);

    return res.json({
      success: true,
      message: `Removal request approved for "${reqItem.hostelName}". The property has been safely archived and removed from public search.`,
      request: reqItem
    });

  } else {
    // Reject removal
    reqItem.status = 'rejected';
    reqItem.adminDecision = {
      decidedBy: adminUser,
      decidedAt: new Date().toISOString(),
      decisionNotes: decisionNotes || 'Removal rejected by Admin. Please resolve student occupancy commitments before requesting removal.'
    };

    if (hostel) {
      hostel.removalPending = false;
      writeJson(HOSTELS_FILE, hostels);
    }

    logAction('ADMIN_REMOVAL_REJECTED', `Removal rejected for ${reqItem.hostelName} (${reqItem.hostelId}): ${decisionNotes}`, adminUser);

    writeJson(REMOVAL_REQUESTS_FILE, removalRequests);

    return res.json({
      success: true,
      message: `Removal request for "${reqItem.hostelName}" was rejected. Property remains active.`,
      request: reqItem
    });
  }
});

// -------------------------------------------------------------
// 17. PUT /api/owner/hostels/:id - Owner Updates Rent, Beds, Rooms, & Info
// -------------------------------------------------------------
app.put('/api/owner/hostels/:id', (req, res) => {
  const { id } = req.params;
  const { rent, availableBeds, totalRooms, description, amenities } = req.body;

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === id);

  if (!hostel) {
    return res.status(404).json({ success: false, message: 'Hostel not found.' });
  }

  if (rent && !isNaN(Number(rent))) hostel.rent = Number(rent);
  if (availableBeds !== undefined && !isNaN(Number(availableBeds))) hostel.availableBeds = Math.max(0, Number(availableBeds));
  if (totalRooms && !isNaN(Number(totalRooms))) hostel.totalRooms = Number(totalRooms);
  if (description && description.trim()) hostel.description = description.trim();
  if (Array.isArray(amenities)) hostel.amenities = amenities;

  hostel.updatedAt = new Date().toISOString();
  writeJson(HOSTELS_FILE, hostels);

  logAction('OWNER_HOSTEL_UPDATED', `Hostel updated: ${hostel.name} (${hostel.id}) - Rent: PKR ${hostel.rent}, Available Beds: ${hostel.availableBeds}`, hostel.owner?.name || 'Owner');

  res.json({
    success: true,
    message: `Hostel details for "${hostel.name}" updated successfully! Changes reflected across the marketplace.`,
    hostel: hostel
  });
});

// -------------------------------------------------------------
// 18. POST /api/inquiries - Student Submits Direct Inquiries
// -------------------------------------------------------------
app.post('/api/inquiries', (req, res) => {
  const { hostelId, studentName, studentPhone, university, preferredRoomType, targetMoveInDate, notes } = req.body;

  if (!hostelId || !studentName || !studentPhone) {
    return res.status(400).json({ success: false, message: 'Please provide hostel ID, student name, and mobile number.' });
  }

  if (!isValidPakPhone(studentPhone)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid Pakistani mobile number (03XXXXXXXXX).' });
  }

  const hostels = readJson(HOSTELS_FILE);
  const hostel = hostels.find(h => h.id === hostelId);

  const inquiries = readJson(INQUIRIES_FILE);
  const newInquiry = {
    inquiryId: `INQ-${2000 + inquiries.length + 1}`,
    hostelId: hostelId,
    hostelName: hostel ? hostel.name : 'Lahore Student Residency',
    studentName: studentName.trim(),
    studentPhone: studentPhone.trim(),
    university: (university && university.trim()) || 'Lahore Student',
    preferredRoomType: preferredRoomType || 'Bi-Seater Shared',
    targetMoveInDate: targetMoveInDate || 'Immediate',
    notes: (notes && notes.trim()) || 'Inquired through Thikana Marketplace',
    status: 'new', // new -> contacted -> interested -> converted -> closed
    createdAt: new Date().toISOString(),
    ownerNotes: null
  };

  inquiries.push(newInquiry);
  writeJson(INQUIRIES_FILE, inquiries);

  res.status(201).json({
    success: true,
    message: 'Your inquiry has been submitted! The hostel warden/owner has received your interest.',
    inquiry: newInquiry
  });
});

// -------------------------------------------------------------
// 19. GET /api/owner/inquiries - Owner Lead Management
// -------------------------------------------------------------
app.get('/api/owner/inquiries', (req, res) => {
  const { phone, hostelId } = req.query;
  const inquiries = readJson(INQUIRIES_FILE);
  const hostels = readJson(HOSTELS_FILE);

  let filtered = inquiries;

  if (hostelId) {
    filtered = filtered.filter(i => i.hostelId === hostelId);
  } else if (phone) {
    const ownerHostelIds = hostels.filter(h => h.owner && h.owner.phone && h.owner.phone.includes(phone.trim())).map(h => h.id);
    filtered = filtered.filter(i => ownerHostelIds.includes(i.hostelId));
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered
  });
});

// -------------------------------------------------------------
// 20. PATCH /api/owner/inquiries/:id/status - Update Inquiry Pipeline
// -------------------------------------------------------------
app.patch('/api/owner/inquiries/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, ownerNotes } = req.body;

  const validStatuses = ['new', 'contacted', 'interested', 'converted', 'closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const inquiries = readJson(INQUIRIES_FILE);
  const inquiry = inquiries.find(i => i.inquiryId === id);

  if (!inquiry) {
    return res.status(404).json({ success: false, message: 'Inquiry not found.' });
  }

  inquiry.status = status;
  if (ownerNotes !== undefined) inquiry.ownerNotes = ownerNotes;
  inquiry.updatedAt = new Date().toISOString();

  writeJson(INQUIRIES_FILE, inquiries);

  res.json({
    success: true,
    message: `Inquiry status updated to "${status}".`,
    inquiry: inquiry
  });
});

// -------------------------------------------------------------
// 21. GET /api/subscriptions/plans - Subscription Tiers
// -------------------------------------------------------------
app.get('/api/subscriptions/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id: 'basic',
        name: 'Basic Starter',
        priceMonthlyPkr: 0,
        maxHostels: 1,
        featured: false,
        features: ['1 Hostel Listing', 'Physical Inspection Audit', 'Basic Analytics', 'Student Inquiries Inbox']
      },
      {
        id: 'professional',
        name: 'Verified Pro',
        priceMonthlyPkr: 999,
        maxHostels: 3,
        featured: true,
        features: ['Up to 3 Hostel Listings', 'Verified Gold Badge Priority', 'WhatsApp Instant Alert Leads', 'Direct Roommate Pairing Pool', '7-Day Swap Guarantee Access']
      },
      {
        id: 'business',
        name: 'Enterprise Host',
        priceMonthlyPkr: 1999,
        maxHostels: 10,
        featured: false,
        features: ['Up to 10 Hostel Listings', 'Top Search Placement', 'Biometric Gate Integration Support', 'Dedicated Account Manager', 'Advanced Financial Revenue Analytics']
      }
    ]
  });
});

// -------------------------------------------------------------
// 22. GET /api/offers - Active Promotional Offers
// -------------------------------------------------------------
app.get('/api/offers', (req, res) => {
  const offers = readJson(OFFERS_FILE);
  res.json({
    success: true,
    count: offers.length,
    data: offers.filter(o => o.active !== false)
  });
});

// -------------------------------------------------------------
// 23. POST /api/owner/subscription/activate-trial - 30-Day Pro Trial
// -------------------------------------------------------------
app.post('/api/owner/subscription/activate-trial', (req, res) => {
  const { ownerPhone, ownerName } = req.body;
  if (!ownerPhone) {
    return res.status(400).json({ success: false, message: 'Owner mobile number is required.' });
  }

  const subscriptions = readJson(SUBSCRIPTIONS_FILE);
  let existing = subscriptions.find(s => s.ownerPhone === ownerPhone.trim());

  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existing) {
    existing.plan = 'professional';
    existing.planName = 'Verified Pro (30-Day Free Trial)';
    existing.monthlyPricePkr = 0;
    existing.regularPricePkr = 999;
    existing.isTrial = true;
    existing.trialDays = 30;
    existing.status = 'active';
    existing.validUntil = trialEnd;
    writeJson(SUBSCRIPTIONS_FILE, subscriptions);
    return res.json({
      success: true,
      message: '🎉 30-Day Verified Pro Free Trial successfully activated for your property!',
      subscription: existing
    });
  }

  const newSub = {
    subscriptionId: `SUB-TRIAL-${1000 + subscriptions.length + 1}`,
    ownerId: `THK-OWN-${Date.now()}`,
    ownerPhone: ownerPhone.trim(),
    ownerName: (ownerName && ownerName.trim()) || 'Hostel Partner',
    plan: 'professional',
    planName: 'Verified Pro (30-Day Free Trial)',
    monthlyPricePkr: 0,
    regularPricePkr: 999,
    isTrial: true,
    trialDays: 30,
    status: 'active',
    validUntil: trialEnd,
    features: [
      '30-Day Free Trial Active (Saving PKR 999)',
      'Up to 3 Hostel Listings Included',
      'Verified Gold Quality Badge Priority',
      'WhatsApp Instant Alert Leads',
      'Full Inquiries & Analytics Access'
    ]
  };

  subscriptions.push(newSub);
  writeJson(SUBSCRIPTIONS_FILE, subscriptions);

  logAction('OWNER_TRIAL_ACTIVATED', `30-Day trial activated for ${newSub.ownerName} (${ownerPhone.trim()})`, 'Owner Portal');

  res.status(201).json({
    success: true,
    message: '🎉 30-Day Verified Pro Free Trial successfully activated!',
    subscription: newSub
  });
});

// -------------------------------------------------------------
// 24. GET /api/owner/subscription - Check Current Plan & Trial Status
// -------------------------------------------------------------
app.get('/api/owner/subscription', (req, res) => {
  const { ownerPhone } = req.query;
  const subscriptions = readJson(SUBSCRIPTIONS_FILE);

  let sub = null;
  if (ownerPhone) {
    sub = subscriptions.find(s => s.ownerPhone === ownerPhone.trim());
  }
  if (!sub && subscriptions.length > 0) {
    sub = subscriptions[0];
  }

  if (!sub) {
    return res.json({
      success: true,
      subscription: {
        plan: 'basic',
        planName: 'Basic Starter',
        monthlyPricePkr: 0,
        isTrial: false,
        status: 'active',
        eligibleForTrial: true
      }
    });
  }

  const now = new Date();
  const validDate = new Date(sub.validUntil);
  const daysRemaining = Math.max(0, Math.ceil((validDate - now) / (1000 * 60 * 60 * 24)));

  res.json({
    success: true,
    subscription: {
      ...sub,
      daysRemaining: daysRemaining,
      isExpired: daysRemaining <= 0
    }
  });
});

// -------------------------------------------------------------
// 25. POST /api/notifications/simulate-push - Simulated PWA Notification Dispatch
// -------------------------------------------------------------
app.post('/api/notifications/simulate-push', (req, res) => {
  const { title, body, url, targetRole } = req.body;

  const notificationPayload = {
    title: title || 'THIKANA VERIFIED ALERT',
    body: body || 'New student lead or inspection status update.',
    icon: '/assets/icons/icon-192.png',
    url: url || '/index.html',
    targetRole: targetRole || 'all',
    dispatchedAt: new Date().toISOString()
  };

  logAction('PUSH_NOTIFICATION_DISPATCHED', `${notificationPayload.title}: ${notificationPayload.body}`, 'Notification Service');

  res.json({
    success: true,
    message: 'Push notification dispatched to registered PWA Service Workers!',
    notification: notificationPayload
  });
});

// -------------------------------------------------------------
// 26. DIRECT REMOVAL & RESTORE ENGINE (SUPER ADMIN CONTROLS)
// -------------------------------------------------------------
function handleDirectRemoveHostel(req, res) {
  const { hostelId, reason, adminName } = req.body || {};
  const hostels = readJson(HOSTELS_FILE);
  const adminUser = adminName || 'Super Admin';

  if (!hostelId) {
    return res.status(400).json({ success: false, message: 'Hostel ID is required (use "ALL" to remove all hostels).' });
  }

  if (hostelId === 'ALL') {
    let count = 0;
    hostels.forEach(h => {
      h.status = 'removed';
      h.isArchived = true;
      h.isRemoved = true;
      h.archivedAt = new Date().toISOString();
      h.removalReason = reason || 'Bulk removed from Home by Super Admin';
      h.removedBy = adminUser;
      count++;
    });
    writeJson(HOSTELS_FILE, hostels);
    logAction('ADMIN_BULK_REMOVED_ALL', `Super Admin removed all ${count} hostels from the public marketplace.`, adminUser);
    return res.json({
      success: true,
      message: `All ${count} hostels have been successfully removed from the Home page / public marketplace.`,
      count: count
    });
  }

  const hostel = hostels.find(h => h.id === hostelId);
  if (!hostel) {
    return res.status(404).json({ success: false, message: `Hostel "${hostelId}" not found.` });
  }

  hostel.status = 'removed';
  hostel.isArchived = true;
  hostel.isRemoved = true;
  hostel.archivedAt = new Date().toISOString();
  hostel.removalReason = reason || 'Directly removed by Admin Executive';
  hostel.removedBy = adminUser;
  writeJson(HOSTELS_FILE, hostels);

  logAction('ADMIN_DIRECT_REMOVAL', `Hostel "${hostel.name}" (${hostel.id}) was directly removed from Home / public marketplace.`, adminUser);

  return res.json({
    success: true,
    message: `Hostel "${hostel.name}" has been removed from the Home page and public marketplace.`,
    hostel: hostel
  });
}

function handleDirectRestoreHostel(req, res) {
  const { hostelId, adminName } = req.body || {};
  const hostels = readJson(HOSTELS_FILE);
  const adminUser = adminName || 'Super Admin';
  const targetId = hostelId || 'ALL';

  if (targetId === 'ALL') {
    let count = 0;
    hostels.forEach(h => {
      h.status = 'approved';
      h.isArchived = false;
      h.isRemoved = false;
      h.isFull = false;
      if (!h.availableBeds || h.availableBeds <= 0) {
        h.availableBeds = 4;
      }
      count++;
    });
    writeJson(HOSTELS_FILE, hostels);
    logAction('ADMIN_BULK_RESTORED_ALL', `Super Admin restored all ${count} hostels to the public marketplace.`, adminUser);
    return res.json({
      success: true,
      message: `All ${count} hostels have been restored to the Home page with active available beds!`,
      count: count
    });
  }

  const hostel = hostels.find(h => h.id === targetId);
  if (!hostel) {
    return res.status(404).json({ success: false, message: `Hostel "${targetId}" not found.` });
  }

  hostel.status = 'approved';
  hostel.isArchived = false;
  hostel.isRemoved = false;
  hostel.isFull = false;
  if (!hostel.availableBeds || hostel.availableBeds <= 0) {
    hostel.availableBeds = 4;
  }
  hostel.restoredAt = new Date().toISOString();
  hostel.restoredBy = adminUser;
  writeJson(HOSTELS_FILE, hostels);

  logAction('ADMIN_DIRECT_RESTORE', `Hostel "${hostel.name}" restored to public marketplace.`, adminUser);

  return res.json({
    success: true,
    message: `Hostel "${hostel.name}" has been restored and is now visible on the Home page.`,
    hostel: hostel
  });
}

// ROUTE BINDINGS
app.post('/api/admin/remove-hostel-direct', handleDirectRemoveHostel);
app.post('/api/admin/remove-hostel', handleDirectRemoveHostel);
app.post('/api/admin/remove-all-hostels', (req, res) => {
  req.body = req.body || {};
  req.body.hostelId = 'ALL';
  return handleDirectRemoveHostel(req, res);
});

app.post('/api/admin/restore-hostel-direct', handleDirectRestoreHostel);
app.post('/api/admin/restore-hostel', handleDirectRestoreHostel);
app.post('/api/admin/restore-all-hostels', (req, res) => {
  req.body = req.body || {};
  req.body.hostelId = 'ALL';
  return handleDirectRestoreHostel(req, res);
});
app.post('/api/admin/restore-hostels', (req, res) => {
  req.body = req.body || {};
  req.body.hostelId = 'ALL';
  return handleDirectRestoreHostel(req, res);
});

// -------------------------------------------------------------
// 28. PERMANENT DELETE HANDLERS (PURGE FROM DATABASE)
// -------------------------------------------------------------
function handleDeleteHostelPermanent(req, res) {
  const hostelId = req.body?.hostelId || req.params?.id;
  const adminName = req.body?.adminName || 'Super Admin';
  let hostels = readJson(HOSTELS_FILE);

  if (!hostelId) {
    return res.status(400).json({ success: false, message: 'Hostel ID is required for permanent deletion.' });
  }

  if (hostelId === 'ALL_REMOVED') {
    const beforeCount = hostels.length;
    hostels = hostels.filter(h => h.status !== 'removed' && !h.isArchived && !h.isRemoved);
    const purgedCount = beforeCount - hostels.length;
    writeJson(HOSTELS_FILE, hostels);
    logAction('ADMIN_PURGED_REMOVED_HOSTELS', `Purged ${purgedCount} removed hostels permanently.`, adminName);
    return res.json({
      success: true,
      message: `Successfully purged ${purgedCount} removed hostels permanently from database.`,
      purgedCount: purgedCount
    });
  }

  if (hostelId === 'ALL') {
    const total = hostels.length;
    writeJson(HOSTELS_FILE, []);
    logAction('ADMIN_PURGED_ALL_HOSTELS', `Purged all ${total} hostels permanently from database.`, adminName);
    return res.json({
      success: true,
      message: `All ${total} hostels deleted permanently.`,
      purgedCount: total
    });
  }

  const idx = hostels.findIndex(h => h.id === hostelId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: `Hostel "${hostelId}" not found.` });
  }

  const deleted = hostels.splice(idx, 1)[0];
  writeJson(HOSTELS_FILE, hostels);
  logAction('ADMIN_PERMANENT_DELETE', `Deleted "${deleted.name}" (${deleted.id}) permanently from database.`, adminName);

  return res.json({
    success: true,
    message: `Hostel "${deleted.name}" has been permanently deleted from database.`,
    deletedHostel: deleted
  });
}

app.post('/api/admin/delete-hostel-permanent', handleDeleteHostelPermanent);
app.post('/api/admin/delete-hostel', handleDeleteHostelPermanent);
app.delete('/api/admin/hostels/:id', (req, res) => {
  req.body = req.body || {};
  req.body.hostelId = req.params.id;
  return handleDeleteHostelPermanent(req, res);
});
app.delete('/api/hostels/:id', (req, res) => {
  req.body = req.body || {};
  req.body.hostelId = req.params.id;
  return handleDeleteHostelPermanent(req, res);
});


// Fallback route serves index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`   THIKANA STUDENT LIVING OS - BACKEND SERVER ACTIVE   `);
    console.log(`   Port: http://localhost:${PORT}                      `);
    console.log(`   Mode: Full Supply Onboarding & Public Marketplace    `);
    console.log(`=======================================================`);
  });
}

module.exports = app;
