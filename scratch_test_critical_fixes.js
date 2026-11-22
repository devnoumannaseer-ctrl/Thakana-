const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          location: res.headers.location,
          body: parsed,
          raw: body
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return first.split(';')[0];
}

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('   THAKANA CRITICAL FIXES VERIFICATION TEST SUITE              ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // TEST GROUP 1: UNAUTHENTICATED DASHBOARD ACCESS (BUG 2 ROOT CAUSE)
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: UNAUTHENTICATED DASHBOARD PROTECTION (EXPECT 302 REDIRECT) ---');

  const dashboards = [
    { name: 'User Dashboard', path: '/user-dashboard.html', expectedRedirect: '/login.html?role=student' },
    { name: 'Owner Dashboard', path: '/owner-portal.html', expectedRedirect: '/login-owner.html' },
    { name: 'Inspector Dashboard', path: '/inspector-portal.html', expectedRedirect: '/login-inspector.html' },
    { name: 'Admin Dashboard', path: '/admin-portal.html', expectedRedirect: '/login-admin.html' }
  ];

  for (const d of dashboards) {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: d.path,
      method: 'GET'
    });

    if (res.status === 302 && res.location === d.expectedRedirect) {
      console.log(`✅ ${d.name} without login correctly blocked: HTTP 302 -> ${res.location}`);
      passed++;
    } else {
      console.log(`❌ ${d.name} without login FAILED. Status: ${res.status}, Location: ${res.location}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: ROLE-BASED DASHBOARD ISOLATION (CROSS-ROLE ATTEMPTS)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: ROLE-BASED DASHBOARD ACCESS & STRICT CROSS-ROLE REDIRECTION ---');

  // 1. Normal User (Student) Login
  const studentLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'student', emailOrPhone: 'student@thakana.pk', password: 'student123' });

  const studentCookie = extractCookie(studentLogin.headers);
  const studentToken = studentLogin.body?.token;

  if (studentLogin.status === 200 && studentToken) {
    console.log('✅ Student Login PASS (Role: student, Cookie & Token obtained)');
    passed++;
  } else {
    console.log('❌ Student Login FAIL');
    failed++;
  }

  // Student opens User Dashboard -> Expect 200
  const studentOwnDashboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/user-dashboard.html',
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  if (studentOwnDashboard.status === 200) {
    console.log('✅ Student authorized access to /user-dashboard.html: HTTP 200 PASS');
    passed++;
  } else {
    console.log('❌ Student access to own dashboard FAILED:', studentOwnDashboard.status);
    failed++;
  }

  // Student attempts to open Admin Dashboard -> Expect Redirect to /user-dashboard.html
  const studentToAdmin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/admin-portal.html',
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  if (studentToAdmin.status === 302 && studentToAdmin.location === '/user-dashboard.html') {
    console.log('✅ Student accessing /admin-portal.html redirected to authorized /user-dashboard.html: PASS');
    passed++;
  } else {
    console.log('❌ Student to Admin dashboard FAILED. Status:', studentToAdmin.status, 'Location:', studentToAdmin.location);
    failed++;
  }

  // Student attempts to open Owner Dashboard -> Expect Redirect to /user-dashboard.html
  const studentToOwner = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/owner-portal.html',
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  if (studentToOwner.status === 302 && studentToOwner.location === '/user-dashboard.html') {
    console.log('✅ Student accessing /owner-portal.html redirected to authorized /user-dashboard.html: PASS');
    passed++;
  } else {
    console.log('❌ Student to Owner dashboard FAILED. Status:', studentToOwner.status, 'Location:', studentToOwner.location);
    failed++;
  }

  // 2. Owner Login
  const ownerLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'owner', emailOrPhone: 'owner@thakana.pk', password: 'owner123' });

  const ownerCookie = extractCookie(ownerLogin.headers);
  const ownerToken = ownerLogin.body?.token;

  // Owner opens Owner Dashboard -> Expect 200
  const ownerOwnDashboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/owner-portal.html',
    method: 'GET',
    headers: { 'Cookie': ownerCookie }
  });

  if (ownerOwnDashboard.status === 200) {
    console.log('✅ Owner authorized access to /owner-portal.html: HTTP 200 PASS');
    passed++;
  } else {
    console.log('❌ Owner access to own dashboard FAILED:', ownerOwnDashboard.status);
    failed++;
  }

  // Owner attempts to open Admin Dashboard -> Expect Redirect to /owner-portal.html
  const ownerToAdmin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/admin-portal.html',
    method: 'GET',
    headers: { 'Cookie': ownerCookie }
  });

  if (ownerToAdmin.status === 302 && ownerToAdmin.location === '/owner-portal.html') {
    console.log('✅ Owner accessing /admin-portal.html redirected to authorized /owner-portal.html: PASS');
    passed++;
  } else {
    console.log('❌ Owner to Admin dashboard FAILED:', ownerToAdmin.status, ownerToAdmin.location);
    failed++;
  }

  // 3. Inspector Login
  const inspectorLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'inspector', emailOrPhone: 'inspector@thakana.pk', password: 'inspector123' });

  const inspectorCookie = extractCookie(inspectorLogin.headers);

  // Inspector opens Inspector Dashboard -> Expect 200
  const inspectorOwnDashboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/inspector-portal.html',
    method: 'GET',
    headers: { 'Cookie': inspectorCookie }
  });

  if (inspectorOwnDashboard.status === 200) {
    console.log('✅ Inspector authorized access to /inspector-portal.html: HTTP 200 PASS');
    passed++;
  } else {
    console.log('❌ Inspector access to own dashboard FAILED:', inspectorOwnDashboard.status);
    failed++;
  }

  // Inspector attempts to open Admin Dashboard -> Expect Redirect to /inspector-portal.html
  const inspectorToAdmin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/admin-portal.html',
    method: 'GET',
    headers: { 'Cookie': inspectorCookie }
  });

  if (inspectorToAdmin.status === 302 && inspectorToAdmin.location === '/inspector-portal.html') {
    console.log('✅ Inspector accessing /admin-portal.html redirected to authorized /inspector-portal.html: PASS');
    passed++;
  } else {
    console.log('❌ Inspector to Admin dashboard FAILED:', inspectorToAdmin.status, inspectorToAdmin.location);
    failed++;
  }

  // 4. Admin Login & Access
  const adminLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'admin', emailOrPhone: 'admin@thakana.pk', password: 'admin123', secretKey: 'thakana2026' });

  const adminCookie = extractCookie(adminLogin.headers);
  const adminToken = adminLogin.body?.token;

  const adminDashboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/admin-portal.html',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });

  if (adminDashboard.status === 200) {
    console.log('✅ Admin authorized access to /admin-portal.html: HTTP 200 PASS');
    passed++;
  } else {
    console.log('❌ Admin dashboard access FAILED:', adminDashboard.status);
    failed++;
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: LOGOUT & SESSION DESTRUCTION
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: LOGOUT & SESSION TERMINATION ---');

  const logoutRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { 'Cookie': studentCookie }
  });

  const clearedCookie = extractCookie(logoutRes.headers);
  if (logoutRes.status === 200 && clearedCookie.startsWith('thakana_token=')) {
    console.log('✅ Logout successfully destroyed session and cleared thakana_token cookie: PASS');
    passed++;
  } else {
    console.log('❌ Logout failed:', logoutRes);
    failed++;
  }

  // Try accessing dashboard with cleared cookie -> Expect 302
  const postLogoutAccess = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/user-dashboard.html',
    method: 'GET',
    headers: { 'Cookie': clearedCookie }
  });

  if (postLogoutAccess.status === 302) {
    console.log('✅ Accessing dashboard after logout correctly redirected: HTTP 302 PASS');
    passed++;
  } else {
    console.log('❌ Post logout access was not blocked:', postLogoutAccess.status);
    failed++;
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: COMPLETE BOOKING WORKFLOW (BUG 1 VERIFICATION)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: BOOKING WORKFLOW, DATA ASSOCIATIONS & VISIBILITY ---');

  // 1. Submit Booking as Authenticated Student
  const bookingPayload = {
    hostelId: 'staezy-1',
    studentName: 'Muhammad Ahmed (Student Resident)',
    studentPhone: '03001234567',
    studentEmail: 'student@thakana.pk',
    parentPhone: '03219876543',
    university: 'UMT Lahore',
    roomType: '2-Person Sharing (Standard)',
    roomNumber: 'Room 204',
    checkInDate: '2026-11-28'
  };

  const createBookingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + studentToken,
      'Cookie': studentCookie
    }
  }, bookingPayload);

  let newBookingId = '';
  if (createBookingRes.status === 201 && createBookingRes.body?.success && createBookingRes.body?.booking) {
    const b = createBookingRes.body.booking;
    newBookingId = b.bookingId;
    console.log(`✅ Booking submission successful: ID ${newBookingId} created`);

    // Verify all 14 required fields
    const requiredFields = [
      'bookingId', 'userId', 'hostelId', 'roomId', 'hostelName',
      'hostelAddress', 'hostelImage', 'roomType', 'roomNumber',
      'monthlyRent', 'bookingDate', 'checkInDate', 'status', 'createdAt', 'updatedAt'
    ];

    const missing = requiredFields.filter(f => b[f] === undefined || b[f] === null || b[f] === '');
    if (missing.length === 0) {
      console.log(`✅ All required fields present on booking record (userId: ${b.userId}, hostelName: "${b.hostelName}", room: "${b.roomNumber}")`);
      passed++;
    } else {
      console.log(`❌ Missing fields on booking:`, missing);
      failed++;
    }
  } else {
    console.log('❌ Booking creation failed:', createBookingRes);
    failed++;
  }

  // 2. Student views My Bookings via API
  const myBookingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/my-bookings',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + studentToken,
      'Cookie': studentCookie
    }
  });

  if (myBookingsRes.status === 200 && Array.isArray(myBookingsRes.body?.data)) {
    const list = myBookingsRes.body.data;
    const found = list.find(x => x.bookingId === newBookingId);
    if (found) {
      console.log(`✅ User Dashboard My Bookings PASS: Retrieved booking ${newBookingId}`);
      console.log(`   Hostel: ${found.hostelName}`);
      console.log(`   Address: ${found.hostelAddress}`);
      console.log(`   Room: ${found.roomNumber} (${found.roomType})`);
      console.log(`   Rent: Rs ${found.monthlyRent} | Check-in: ${found.checkInDate} | Status: ${found.status}`);
      passed++;
    } else {
      console.log(`❌ Created booking ${newBookingId} not found in student's My Bookings!`);
      failed++;
    }
  } else {
    console.log('❌ Failed to retrieve My Bookings:', myBookingsRes.status);
    failed++;
  }

  // 3. View Details of Single Booking
  const singleBookingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${newBookingId}`,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  if (singleBookingRes.status === 200 && singleBookingRes.body?.booking) {
    console.log(`✅ View Details PASS: Booking ${newBookingId} details successfully retrieved`);
    passed++;
  } else {
    console.log('❌ View Details failed:', singleBookingRes.status);
    failed++;
  }

  // 4. Cancel Booking
  const cancelRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${newBookingId}/cancel`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + studentToken
    }
  }, { reason: 'Schedule conflict with semester exams' });

  if (cancelRes.status === 200 && cancelRes.body?.success) {
    console.log(`✅ Cancel Booking PASS: Booking ${newBookingId} cancelled according to escrow policy`);
    passed++;
  } else {
    console.log('❌ Cancel Booking failed:', cancelRes);
    failed++;
  }

  // 5. Booking IDOR Protection (Another User cannot cancel or view)
  const idorRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${newBookingId}/cancel`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ownerToken
    }
  }, { reason: 'Unauthorized cancel attempt' });

  if (idorRes.status === 403) {
    console.log('✅ Booking IDOR Prevention PASS: Unauthorized user cancel rejected with HTTP 403 Forbidden');
    passed++;
  } else {
    console.log('❌ IDOR Prevention failed. Status:', idorRes.status);
    failed++;
  }

  // 6. Hostel Owner sees the booking request for their property
  const ownerBookingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/owner/my-bookings',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + ownerToken }
  });

  if (ownerBookingsRes.status === 200 && Array.isArray(ownerBookingsRes.body?.data)) {
    const ownerList = ownerBookingsRes.body.data;
    const foundInOwner = ownerList.find(x => x.bookingId === newBookingId);
    if (foundInOwner) {
      console.log(`✅ Owner Portal Visibility PASS: Owner saw booking request ${newBookingId} for hostel "${foundInOwner.hostelName}"`);
      passed++;
    } else {
      console.log(`❌ Booking ${newBookingId} not visible to property owner!`);
      failed++;
    }
  } else {
    console.log('❌ Failed to fetch owner bookings:', ownerBookingsRes.status);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`CRITICAL FIXES TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runComprehensiveTests();
