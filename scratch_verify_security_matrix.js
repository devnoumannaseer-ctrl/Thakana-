const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runSecurityTests() {
  console.log('========================================================');
  console.log('   THAKANA RBAC & PERMISSION SECURITY MATRIX TESTS     ');
  console.log('========================================================\n');
  let passed = 0;
  let failed = 0;

  // 1. LOGIN TESTS FOR ALL 4 ROLES
  console.log('--- 1. AUTHENTICATION & TOKEN ISSUANCE FOR 4 ROLES ---');
  let studentToken = '', ownerToken = '', inspectorToken = '', adminToken = '';

  try {
    const studentLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'student', emailOrPhone: 'student@thakana.pk', password: 'student123' });

    if (studentLogin.status === 200 && studentLogin.body.token && studentLogin.body.user.role === 'student') {
      console.log('✅ Student Login PASS (Role: student, Token received)');
      studentToken = studentLogin.body.token;
      passed++;
    } else {
      console.log('❌ Student Login FAIL:', studentLogin);
      failed++;
    }

    const ownerLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'owner', emailOrPhone: 'owner@thakana.pk', password: 'owner123' });

    if (ownerLogin.status === 200 && ownerLogin.body.token && ownerLogin.body.user.role === 'owner') {
      console.log('✅ Owner Login PASS (Role: owner, Token received)');
      ownerToken = ownerLogin.body.token;
      passed++;
    } else {
      console.log('❌ Owner Login FAIL:', ownerLogin);
      failed++;
    }

    const inspectorLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'inspector', emailOrPhone: 'inspector@thakana.pk', password: 'inspector123' });

    if (inspectorLogin.status === 200 && inspectorLogin.body.token && inspectorLogin.body.user.role === 'inspector') {
      console.log('✅ Inspector Login PASS (Role: inspector, Token received)');
      inspectorToken = inspectorLogin.body.token;
      passed++;
    } else {
      console.log('❌ Inspector Login FAIL:', inspectorLogin);
      failed++;
    }

    const adminLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { role: 'admin', emailOrPhone: 'admin@thakana.pk', password: 'admin123', secretKey: 'thakana2026' });

    if (adminLogin.status === 200 && adminLogin.body.token && adminLogin.body.user.role === 'admin') {
      console.log('✅ Admin Login PASS (Role: admin, Token received)');
      adminToken = adminLogin.body.token;
      passed++;
    } else {
      console.log('❌ Admin Login FAIL:', adminLogin);
      failed++;
    }

  } catch (e) {
    console.error('Login testing error:', e);
    failed++;
  }

  // 2. UNAUTHENTICATED ACCESS PREVENTION (401 TEST)
  console.log('\n--- 2. UNAUTHENTICATED ACCESS PREVENTION (EXPECT 401) ---');
  try {
    const unauthRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET'
    });

    if (unauthRes.status === 401) {
      console.log('✅ Unauthenticated access to /api/admin/users correctly rejected with 401 Unauthorized');
      passed++;
    } else {
      console.log('❌ Expected 401, got:', unauthRes.status);
      failed++;
    }

    const unauthOwner = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/owner/my-hostels',
      method: 'GET'
    });

    if (unauthOwner.status === 401) {
      console.log('✅ Unauthenticated access to /api/owner/my-hostels correctly rejected with 401 Unauthorized');
      passed++;
    } else {
      console.log('❌ Expected 401, got:', unauthOwner.status);
      failed++;
    }
  } catch (e) {
    console.error('Unauth test error:', e);
    failed++;
  }

  // 3. STUDENT HORIZONTAL / VERTICAL ESCALATION (EXPECT 403)
  console.log('\n--- 3. STUDENT RESTRICTIONS & PRIVILEGE ESCALATION BLOCK ---');
  try {
    const studentToAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + studentToken }
    });

    if (studentToAdmin.status === 403) {
      console.log('✅ Student calling /api/admin/users blocked with 403 Forbidden');
      passed++;
    } else {
      console.log('❌ Expected 403, got:', studentToAdmin.status);
      failed++;
    }

    const studentToOwnerApi = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/owner/my-hostels',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + studentToken }
    });

    if (studentToOwnerApi.status === 403) {
      console.log('✅ Student calling /api/owner/my-hostels blocked with 403 Forbidden');
      passed++;
    } else {
      console.log('❌ Expected 403, got:', studentToOwnerApi.status);
      failed++;
    }

    // Role escalation attempt via profile update
    const studentRoleEscalation = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/user/profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + studentToken
      }
    }, { name: 'Hacker Student', role: 'admin' });

    if (studentRoleEscalation.status === 200 && studentRoleEscalation.body.user.role === 'student') {
      console.log('✅ Privilege Escalation Prevention PASS: Student profile update role ignored (remained "student")');
      passed++;
    } else {
      console.log('❌ Privilege escalation occurred:', studentRoleEscalation);
      failed++;
    }
  } catch (e) {
    console.error('Student privilege test error:', e);
    failed++;
  }

  // 4. OWNER RESOURCE ISOLATION & IDOR PREVENT (EXPECT 403)
  console.log('\n--- 4. OWNER IDOR & RESOURCE OWNERSHIP CHECK ---');
  try {
    // Owner tries to access admin API
    const ownerToAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + ownerToken }
    });

    if (ownerToAdmin.status === 403) {
      console.log('✅ Owner calling /api/admin/users blocked with 403 Forbidden');
      passed++;
    } else {
      console.log('❌ Expected 403, got:', ownerToAdmin.status);
      failed++;
    }

    // Owner tries to update bed inventory on non-existent or unowned property
    const ownerIdor = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/owner/update-beds',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ownerToken
      }
    }, { hostelId: 'hostel-99999-unowned', delta: 1 });

    if (ownerIdor.status === 403 || ownerIdor.status === 404) {
      console.log(`✅ Owner IDOR blocked on unowned hostel with HTTP ${ownerIdor.status} (${ownerIdor.body?.message || 'Access Denied'})`);
      passed++;
    } else {
      console.log('❌ Expected 403 or 404, got:', ownerIdor.status);
      failed++;
    }
  } catch (e) {
    console.error('Owner IDOR test error:', e);
    failed++;
  }

  // 5. INSPECTOR ASSIGNMENT VERIFICATION & RESTRICTIONS
  console.log('\n--- 5. INSPECTOR ASSIGNMENT & PERMISSION BOUNDARIES ---');
  try {
    const inspectorToAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + inspectorToken }
    });

    if (inspectorToAdmin.status === 403) {
      console.log('✅ Inspector calling /api/admin/users blocked with 403 Forbidden');
      passed++;
    } else {
      console.log('❌ Expected 403, got:', inspectorToAdmin.status);
      failed++;
    }

    // Inspector tries to submit audit on unassigned hostel
    const inspectorIdor = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/audit-submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + inspectorToken
      }
    }, { hostelId: 'hostel-unassigned-random-999', inspectorName: 'Inspector Saif', waterTdsPpm: 120, noiseDecibels: 40 });

    if (inspectorIdor.status === 403 || inspectorIdor.status === 404) {
      console.log(`✅ Inspector audit on unassigned property blocked with HTTP ${inspectorIdor.status} (${inspectorIdor.body?.message || 'Access Denied'})`);
      passed++;
    } else {
      console.log('❌ Expected 403 or 404, got:', inspectorIdor.status);
      failed++;
    }
  } catch (e) {
    console.error('Inspector boundary test error:', e);
    failed++;
  }

  // 6. ADMIN AUTHORIZATION & SYSTEM GOVERNANCE (EXPECT 200)
  console.log('\n--- 6. ADMIN AUTHORIZED ACCESS & GOVERNANCE ---');
  try {
    const adminUsers = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });

    if (adminUsers.status === 200 && adminUsers.body.success) {
      console.log(`✅ Admin accessing /api/admin/users PASS (${adminUsers.body.data.length} registered platform users retrieved)`);
      passed++;
    } else {
      console.log('❌ Admin users fetch failed:', adminUsers);
      failed++;
    }

    const adminAudits = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/audits',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + adminToken }
    });

    if (adminAudits.status === 200 && adminAudits.body.success) {
      console.log(`✅ Admin accessing /api/admin/audits PASS (${adminAudits.body.data.length} inspection reports retrieved)`);
      passed++;
    } else {
      console.log('❌ Admin audits fetch failed:', adminAudits);
      failed++;
    }
  } catch (e) {
    console.error('Admin test error:', e);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`SECURITY MATRIX SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');
}

runSecurityTests();
