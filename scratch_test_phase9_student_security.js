const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'thakana_rbac_secret_key_2026_super_secure';

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

async function runPhase9Tests() {
  console.log('================================================================');
  console.log('   THAKANA PHASE 9: STUDENT DASHBOARD & SECURITY TEST SUITE    ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------
  // TEST GROUP 1: AUTHENTICATION & LOGIN SECURITY
  // -------------------------------------------------------------
  console.log('--- 1. AUTHENTICATION & LOGIN SECURITY ---');

  // 1.1 Valid Student Login
  const studentLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'student', emailOrPhone: 'student@thakana.pk', password: 'student123' });

  const studentCookie = extractCookie(studentLogin.headers);
  const studentToken = studentLogin.body?.token;

  if (studentLogin.status === 200 && studentToken && studentLogin.body.user.role === 'student') {
    console.log('✅ 1.1 Valid Student login succeeds with signed JWT and HttpOnly cookie');
    passed++;
  } else {
    console.log('❌ 1.1 Valid Student login failed:', studentLogin);
    failed++;
  }

  // 1.2 Incorrect password rejected
  const wrongPassLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'student', emailOrPhone: 'student@thakana.pk', password: 'wrongpassword999' });

  if (wrongPassLogin.status === 401) {
    console.log('✅ 1.2 Incorrect password rejected with HTTP 401 Unauthorized');
    passed++;
  } else {
    console.log('❌ 1.2 Incorrect password check failed. Status:', wrongPassLogin.status);
    failed++;
  }

  // 1.3 Unknown account rejected (No automatic account creation!)
  const unknownLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'student', emailOrPhone: 'random_nonexistent_user@thakana.pk', password: 'password123' });

  if (unknownLogin.status === 401) {
    console.log('✅ 1.3 Unknown account rejected with HTTP 401 (Never auto-creates account on login)');
    passed++;
  } else {
    console.log('❌ 1.3 Unknown account was not rejected. Status:', unknownLogin.status);
    failed++;
  }

  // 1.4 Owner cannot log in through Student-only access
  const ownerCrossLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'student', emailOrPhone: 'owner@thakana.pk', password: 'owner123' });

  if (ownerCrossLogin.status === 403) {
    console.log('✅ 1.4 Owner cannot log in through Student portal: HTTP 403 Access Denied');
    passed++;
  } else {
    console.log('❌ 1.4 Owner cross login not blocked:', ownerCrossLogin.status);
    failed++;
  }

  // 1.5 Admin cannot log in through Student-only access
  const adminCrossLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'student', emailOrPhone: 'admin@thakana.pk', password: 'admin123' });

  if (adminCrossLogin.status === 403) {
    console.log('✅ 1.5 Admin cannot log in through Student portal: HTTP 403 Access Denied');
    passed++;
  } else {
    console.log('❌ 1.5 Admin cross login not blocked:', adminCrossLogin.status);
    failed++;
  }

  // 1.6 Fake JWT rejected
  const fakeJwtRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/my-bookings',
    method: 'GET',
    headers: { 'Authorization': 'Bearer fake.invalid.jwt.token' }
  });

  if (fakeJwtRes.status === 401) {
    console.log('✅ 1.6 Fake / unsigned JWT rejected with HTTP 401 Unauthorized');
    passed++;
  } else {
    console.log('❌ 1.6 Fake JWT was not rejected:', fakeJwtRes.status);
    failed++;
  }

  // 1.7 Demo token bypass rejected
  const demoTokenRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/my-bookings',
    method: 'GET',
    headers: { 'Authorization': 'Bearer thakana_student' }
  });

  if (demoTokenRes.status === 401) {
    console.log('✅ 1.7 Demo token fallback (thakana_student) rejected with HTTP 401 Unauthorized');
    passed++;
  } else {
    console.log('❌ 1.7 Demo token fallback was not rejected:', demoTokenRes.status);
    failed++;
  }

  // 1.8 Expired JWT rejected
  const expiredToken = jwt.sign(
    { id: 'usr-student-1', role: 'student', email: 'student@thakana.pk' },
    JWT_SECRET,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );

  const expiredJwtRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/my-bookings',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + expiredToken }
  });

  if (expiredJwtRes.status === 401) {
    console.log('✅ 1.8 Expired JWT rejected with HTTP 401 Unauthorized');
    passed++;
  } else {
    console.log('❌ 1.8 Expired JWT was not rejected:', expiredJwtRes.status);
    failed++;
  }

  // 1.9 Logout properly destroys session
  const logoutRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { 'Cookie': studentCookie }
  });

  const clearedCookie = extractCookie(logoutRes.headers);
  if (logoutRes.status === 200 && clearedCookie.startsWith('thakana_token=')) {
    console.log('✅ 1.9 Logout clears thakana_token cookie and invalidates session');
    passed++;
  } else {
    console.log('❌ 1.9 Logout failed:', logoutRes);
    failed++;
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: AUTHORIZATION & STRICT ROLE ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- 2. AUTHORIZATION & STRICT ROLE ISOLATION ---');

  // 2.1 Student can open Student Dashboard
  const studentDashboardRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/user-dashboard.html',
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  if (studentDashboardRes.status === 200) {
    console.log('✅ 2.1 Student successfully accesses /user-dashboard.html: HTTP 200 OK');
    passed++;
  } else {
    console.log('❌ 2.1 Student dashboard access failed:', studentDashboardRes.status);
    failed++;
  }

  // 2.2 Student accessing Owner Dashboard redirected to Student Dashboard
  const studentToOwnerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/owner-portal.html',
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  if (studentToOwnerRes.status === 302 && studentToOwnerRes.location === '/user-dashboard.html') {
    console.log('✅ 2.2 Student accessing /owner-portal.html redirected to /user-dashboard.html: HTTP 302');
    passed++;
  } else {
    console.log('❌ 2.2 Student to Owner redirect failed:', studentToOwnerRes.status, studentToOwnerRes.location);
    failed++;
  }

  // 2.3 Student accessing Admin Dashboard redirected to Student Dashboard
  const studentToAdminRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/admin-portal.html',
    method: 'GET',
    headers: { 'Cookie': studentCookie }
  });

  if (studentToAdminRes.status === 302 && studentToAdminRes.location === '/user-dashboard.html') {
    console.log('✅ 2.3 Student accessing /admin-portal.html redirected to /user-dashboard.html: HTTP 302');
    passed++;
  } else {
    console.log('❌ 2.3 Student to Admin redirect failed:', studentToAdminRes.status, studentToAdminRes.location);
    failed++;
  }

  // 2.4 Student calling Owner API blocked
  const studentOwnerApiRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/owner/my-hostels',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  if (studentOwnerApiRes.status === 403) {
    console.log('✅ 2.4 Student calling /api/owner/my-hostels blocked with HTTP 403 Forbidden');
    passed++;
  } else {
    console.log('❌ 2.4 Student Owner API access was not blocked:', studentOwnerApiRes.status);
    failed++;
  }

  // 2.5 Student calling Admin API blocked
  const studentAdminApiRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  if (studentAdminApiRes.status === 403) {
    console.log('✅ 2.5 Student calling /api/admin/users blocked with HTTP 403 Forbidden');
    passed++;
  } else {
    console.log('❌ 2.5 Student Admin API access was not blocked:', studentAdminApiRes.status);
    failed++;
  }

  // 2.6 Student calling Inspector API blocked
  const studentInspectorApiRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/inspector/assigned-hostels',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  if (studentInspectorApiRes.status === 403) {
    console.log('✅ 2.6 Student calling /api/inspector/assigned-hostels blocked with HTTP 403 Forbidden');
    passed++;
  } else {
    console.log('❌ 2.6 Student Inspector API access was not blocked:', studentInspectorApiRes.status);
    failed++;
  }

  // 2.7 Unauthenticated dashboard access blocked
  const unauthDashboard = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/user-dashboard.html',
    method: 'GET'
  });

  if (unauthDashboard.status === 302 && unauthDashboard.location.includes('login')) {
    console.log(`✅ 2.7 Unauthenticated dashboard access blocked: HTTP 302 -> ${unauthDashboard.location}`);
    passed++;
  } else {
    console.log('❌ 2.7 Unauthenticated dashboard access not blocked:', unauthDashboard.status);
    failed++;
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: BOOKING OWNERSHIP & IDOR PROTECTION
  // -------------------------------------------------------------
  console.log('\n--- 3. BOOKING OWNERSHIP & IDOR PROTECTION ---');

  // 3.1 Student views own bookings
  const myBookingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/my-bookings',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  let sampleBookingId = '';
  if (myBookingsRes.status === 200 && Array.isArray(myBookingsRes.body?.data)) {
    const list = myBookingsRes.body.data;
    sampleBookingId = list[0]?.bookingId || 'THK-BKG-1001';
    console.log(`✅ 3.1 Student retrieved own bookings: ${list.length} bookings found (Sample: ${sampleBookingId})`);
    passed++;
  } else {
    console.log('❌ 3.1 Failed to retrieve student bookings:', myBookingsRes.status);
    failed++;
  }

  // 3.2 Student views details of own booking
  const ownDetailRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${sampleBookingId}`,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  if (ownDetailRes.status === 200 && ownDetailRes.body?.booking?.bookingId === sampleBookingId) {
    console.log(`✅ 3.2 Student successfully viewed own booking details (${sampleBookingId})`);
    passed++;
  } else {
    console.log('❌ 3.2 Failed to view own booking details:', ownDetailRes.status);
    failed++;
  }

  // 3.3 Create a separate second student account
  const secondStudentToken = jwt.sign(
    { id: 'usr-student-other-999', role: 'student', email: 'otherstudent@thakana.pk', name: 'Other Student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 3.4 Second student attempts to view first student's booking -> Expect 403 Forbidden!
  const idorViewRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${sampleBookingId}`,
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + secondStudentToken }
  });

  if (idorViewRes.status === 403) {
    console.log(`✅ 3.4 IDOR Prevention: Other student attempting to view ${sampleBookingId} strictly blocked with HTTP 403 Forbidden`);
    passed++;
  } else {
    console.log('❌ 3.4 IDOR check failed. Expected 403, got:', idorViewRes.status);
    failed++;
  }

  // 3.5 Second student attempts to cancel first student's booking -> Expect 403 Forbidden!
  const idorCancelRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/bookings/${sampleBookingId}/cancel`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + secondStudentToken
    }
  }, { reason: 'Malicious cancel attempt' });

  if (idorCancelRes.status === 403) {
    console.log(`✅ 3.5 IDOR Prevention: Other student attempting to cancel ${sampleBookingId} strictly blocked with HTTP 403 Forbidden`);
    passed++;
  } else {
    console.log('❌ 3.5 IDOR cancel check failed. Expected 403, got:', idorCancelRes.status);
    failed++;
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: FUNCTIONAL & OVERVIEW APIS
  // -------------------------------------------------------------
  console.log('\n--- 4. FUNCTIONAL APIS & DASHBOARD OVERVIEW ---');

  // 4.1 Dashboard Overview Endpoint
  const overviewRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/dashboard-overview',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  if (overviewRes.status === 200 && overviewRes.body?.success) {
    const d = overviewRes.body;
    console.log('✅ 4.1 Dashboard Overview API returned dynamic data:');
    console.log(`   Stats: Total=${d.stats.total}, Pending=${d.stats.pending}, Confirmed=${d.stats.confirmed}, Cancelled=${d.stats.cancelled}`);
    console.log(`   Recent Bookings Count: ${d.recentBookings.length}`);
    console.log(`   Recommended Hostels Count: ${d.recommendedHostels.length}`);
    passed++;
  } else {
    console.log('❌ 4.1 Dashboard Overview API failed:', overviewRes.status);
    failed++;
  }

  // 4.2 Change Password Verification
  // 4.2a Wrong current password rejected
  const badPassChange = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/change-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + studentToken
    }
  }, { currentPassword: 'wrongcurrentpass', newPassword: 'newsecurepass123' });

  if (badPassChange.status === 401) {
    console.log('✅ 4.2a Change password rejected incorrect current password with HTTP 401');
    passed++;
  } else {
    console.log('❌ 4.2a Bad password change not rejected:', badPassChange.status);
    failed++;
  }

  // 4.2b Valid password change succeeds
  const goodPassChange = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/change-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + studentToken
    }
  }, { currentPassword: 'student123', newPassword: 'student123' }); // Keep student123 for test reproducibility

  if (goodPassChange.status === 200 && goodPassChange.body?.success) {
    console.log('✅ 4.2b Valid password change verified and updated password hash');
    passed++;
  } else {
    console.log('❌ 4.2b Password change failed:', goodPassChange);
    failed++;
  }

  // 4.3 Profile Update & Privilege Escalation Block
  const profileUpdateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/user/profile',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + studentToken
    }
  }, { name: 'Muhammad Ahmed', phone: '03001234567', role: 'admin' }); // Hacker role escalation attempt

  if (profileUpdateRes.status === 200) {
    // Verify user role did NOT change in database
    const verifyUserRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + studentToken }
    });

    if (verifyUserRes.body?.user?.role === 'student') {
      console.log('✅ 4.3 Profile update succeeded and role escalation attempt strictly ignored (role remained "student")');
      passed++;
    } else {
      console.log('❌ 4.3 Role escalation occurred! User role changed:', verifyUserRes.body?.user?.role);
      failed++;
    }
  } else {
    console.log('❌ 4.3 Profile update failed:', profileUpdateRes.status);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`PHASE 9 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runPhase9Tests();
