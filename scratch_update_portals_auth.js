const fs = require('fs');

// -------------------------------------------------------------
// 1. UPDATE public/index.html
// -------------------------------------------------------------
let indexHtml = fs.readFileSync('public/index.html', 'utf8');

// Replace top bar right side with 3 Login links
const topBarRightOld = /<div class="text-\[11px\] font-semibold text-white\/70 hidden md:flex items-center gap-3 shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const topBarRightNew = `<div class="flex items-center gap-2 shrink-0">
        <span class="text-white/50 text-[11px] hidden xl:inline">Portal Logins:</span>
        <div class="flex items-center gap-1 text-[11px] font-bold">
          <a href="login-user.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-graduation-cap text-[#826bbd]"></i> <span class="hidden sm:inline">Student</span>
          </a>
          <a href="login-owner.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-buildings text-amber-300"></i> <span class="hidden sm:inline">Owner</span>
          </a>
          <a href="login-admin.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-shield-check text-rose-300"></i> <span class="hidden sm:inline">Admin</span>
          </a>
        </div>
      </div>
    </div>
  </div>`;
indexHtml = indexHtml.replace(topBarRightOld, topBarRightNew);

// In desktop nav, add userAuthSlot right before host with us
if (!indexHtml.includes('id="userAuthSlot"')) {
  indexHtml = indexHtml.replace(
    '<!-- HOST WITH US BUTTON',
    `<div id="userAuthSlot" class="hidden sm:inline-flex"></div>\n          <!-- HOST WITH US BUTTON`
  );
}

// In mobile drawer, add portal login buttons
if (!indexHtml.includes('id="mobileAuthSlot"')) {
  const drawerLinksOld = /<\/div>\s*<\/div>\s*<div id="mobileBackdrop"/;
  const drawerLinksNew = `      <div id="mobileAuthSlot" class="pt-2 border-t border-white/10"></div>
      <div class="pt-2 border-t border-white/10 text-xs space-y-1.5">
        <span class="text-white/50 text-[10px] font-extrabold uppercase tracking-wider block">Portals Login Mode:</span>
        <div class="grid grid-cols-3 gap-1.5 text-center font-bold text-xs">
          <a href="login-user.html" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white flex flex-col items-center">
            <i class="ph-bold ph-graduation-cap text-base text-[#826bbd] mb-0.5"></i> Student
          </a>
          <a href="login-owner.html" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white flex flex-col items-center">
            <i class="ph-bold ph-buildings text-base text-amber-300 mb-0.5"></i> Owner
          </a>
          <a href="login-admin.html" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white flex flex-col items-center">
            <i class="ph-bold ph-shield-check text-base text-rose-300 mb-0.5"></i> Admin
          </a>
        </div>
      </div>
    </div>
  </div>
  <div id="mobileBackdrop"`;
  indexHtml = indexHtml.replace(drawerLinksOld, drawerLinksNew);
}

// Add user auth sync script in index.html
if (!indexHtml.includes('function syncUserAuthHeader()')) {
  const authHelperCode = `
    // User Auth Header Sync
    function syncUserAuthHeader() {
      const authSlot = document.getElementById('userAuthSlot');
      const mobileSlot = document.getElementById('mobileAuthSlot');
      let user = null;
      try {
        const uStr = localStorage.getItem('thakana_user') || localStorage.getItem('thakana_auth_user');
        if (uStr) user = JSON.parse(uStr);
      } catch (e) {}

      if (user && user.name) {
        if (authSlot) {
          authSlot.innerHTML = \`
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20 shadow-sm">
              <i class="ph-bold ph-user-circle text-emerald-300 text-sm"></i>
              <span>\${user.name.split(' ')[0]}</span>
              <button onclick="logoutAuthUser(event)" class="ml-1 hover:text-rose-300 transition" title="Logout"><i class="ph-bold ph-sign-out text-xs"></i></button>
            </div>
          \`;
        }
        if (mobileSlot) {
          mobileSlot.innerHTML = \`
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold">
              <span class="flex items-center gap-2"><i class="ph-bold ph-user-circle text-emerald-300 text-base"></i> \${user.name} (\${user.role || 'Student'})</span>
              <button onclick="logoutAuthUser(event)" class="text-rose-300 font-bold hover:underline">Logout</button>
            </div>
          \`;
        }
      } else {
        if (authSlot) {
          authSlot.innerHTML = \`
            <a href="login.html?role=student" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition">
              <i class="ph-bold ph-sign-in"></i> <span>Login</span>
            </a>
          \`;
        }
        if (mobileSlot) {
          mobileSlot.innerHTML = \`
            <a href="login.html?role=student" class="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition">
              <span class="flex items-center gap-2"><i class="ph-bold ph-sign-in text-base text-[#826bbd]"></i> Student Log In / Register</span>
              <i class="ph-bold ph-caret-right text-xs"></i>
            </a>
          \`;
        }
      }
    }

    function logoutAuthUser(e) {
      if (e) e.stopPropagation();
      localStorage.removeItem('thakana_user');
      localStorage.removeItem('thakana_auth_user');
      syncUserAuthHeader();
    }
  `;

  indexHtml = indexHtml.replace('// INITIALIZATION', authHelperCode + '\n    // INITIALIZATION');
  indexHtml = indexHtml.replace('fetchHostels();', 'fetchHostels();\n      syncUserAuthHeader();');
}

fs.writeFileSync('public/index.html', indexHtml, 'utf8');
console.log('Updated public/index.html');


// -------------------------------------------------------------
// 2. UPDATE public/owner-portal.html
// -------------------------------------------------------------
let ownerHtml = fs.readFileSync('public/owner-portal.html', 'utf8');

// Top bar logins
const ownerTopBarOld = /<div class="text-\[11px\] font-semibold text-white\/70 hidden md:flex items-center gap-3 shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const ownerTopBarNew = `<div class="flex items-center gap-2 shrink-0">
        <span class="text-white/50 text-[11px] hidden xl:inline">Portal Logins:</span>
        <div class="flex items-center gap-1 text-[11px] font-bold">
          <a href="login-user.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-graduation-cap text-[#826bbd]"></i> <span class="hidden sm:inline">Student</span>
          </a>
          <a href="login-owner.html" class="px-2 py-0.5 rounded-md bg-amber-600 text-white transition flex items-center gap-1 shadow-sm">
            <i class="ph-bold ph-buildings"></i> <span class="hidden sm:inline">Owner Login</span>
          </a>
          <a href="login-admin.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-shield-check text-rose-300"></i> <span class="hidden sm:inline">Admin</span>
          </a>
        </div>
      </div>
    </div>
  </div>`;
ownerHtml = ownerHtml.replace(ownerTopBarOld, ownerTopBarNew);

// In header actions
const ownerHeaderNavOld = /<div class="flex items-center gap-2">[\s\S]*?<a href="index.html" class="px-3 py-1.5 rounded-full bg-white\/15 hover:bg-white\/25 text-white text-xs font-bold transition">[\s\S]*?Back to Search[\s\S]*?<\/a>[\s\S]*?<\/div>/;
const ownerHeaderNavNew = `<div class="flex items-center gap-2">
          <div id="ownerSessionPill" class="hidden sm:inline-flex"></div>
          <a href="login-owner.html" id="ownerLoginBtn" class="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1">
            <i class="ph-bold ph-sign-in"></i> Owner Login
          </a>
          <a href="index.html" class="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition">
            <i class="ph-bold ph-arrow-left"></i> Home
          </a>
        </div>`;
ownerHtml = ownerHtml.replace(ownerHeaderNavOld, ownerHeaderNavNew);

// Add Owner Session Script
if (!ownerHtml.includes('function syncOwnerSession()')) {
  const ownerSessionScript = `
    function syncOwnerSession() {
      const pill = document.getElementById('ownerSessionPill');
      const loginBtn = document.getElementById('ownerLoginBtn');
      let owner = null;
      try {
        const oStr = localStorage.getItem('thakana_owner') || localStorage.getItem('thakana_auth_user');
        if (oStr) owner = JSON.parse(oStr);
      } catch (e) {}

      if (owner && (owner.role === 'owner' || owner.hostelName)) {
        if (pill) {
          pill.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30';
          pill.innerHTML = \`<i class="ph-bold ph-buildings text-amber-300"></i> <span>\${owner.name || 'Owner'}</span> <button onclick="logoutOwner()" class="ml-1 hover:text-white" title="Logout"><i class="ph-bold ph-sign-out"></i></button>\`;
        }
        if (loginBtn) loginBtn.classList.add('hidden');
      } else {
        if (pill) pill.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
      }
    }

    function logoutOwner() {
      localStorage.removeItem('thakana_owner');
      window.location.reload();
    }

    window.addEventListener('DOMContentLoaded', syncOwnerSession);
  `;

  ownerHtml = ownerHtml.replace('</script>', ownerSessionScript + '\n</script>');
}

fs.writeFileSync('public/owner-portal.html', ownerHtml, 'utf8');
console.log('Updated public/owner-portal.html');


// -------------------------------------------------------------
// 3. UPDATE public/admin-portal.html
// -------------------------------------------------------------
let adminHtml = fs.readFileSync('public/admin-portal.html', 'utf8');

// Top bar logins
const adminTopBarOld = /<div class="text-\[11px\] font-semibold text-white\/70 hidden md:flex items-center gap-3 shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const adminTopBarNew = `<div class="flex items-center gap-2 shrink-0">
        <span class="text-white/50 text-[11px] hidden xl:inline">Portal Logins:</span>
        <div class="flex items-center gap-1 text-[11px] font-bold">
          <a href="login-user.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-graduation-cap text-[#826bbd]"></i> <span class="hidden sm:inline">Student</span>
          </a>
          <a href="login-owner.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-buildings text-amber-300"></i> <span class="hidden sm:inline">Owner</span>
          </a>
          <a href="login-admin.html" class="px-2 py-0.5 rounded-md bg-rose-600 text-white transition flex items-center gap-1 shadow-sm font-bold">
            <i class="ph-bold ph-shield-check"></i> <span class="hidden sm:inline">Admin Login</span>
          </a>
        </div>
      </div>
    </div>
  </div>`;
adminHtml = adminHtml.replace(adminTopBarOld, adminTopBarNew);

// Admin header actions
const adminHeaderNavOld = /<div class="flex items-center gap-2">[\s\S]*?<a href="index.html" class="px-3 py-1.5 rounded-full bg-white\/10 hover:bg-white\/20 text-white text-xs font-bold transition flex items-center gap-1">[\s\S]*?View Home[\s\S]*?<\/a>[\s\S]*?<\/div>/;
const adminHeaderNavNew = `<div class="flex items-center gap-2">
        <div id="adminSessionPill" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <i class="ph-bold ph-shield-check text-rose-400"></i>
          <span>Super Admin</span>
          <button onclick="logoutAdmin()" class="ml-1 text-white hover:text-rose-200" title="Logout Admin"><i class="ph-bold ph-sign-out"></i></button>
        </div>
        <a href="index.html" class="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1">
          <i class="ph-bold ph-storefront"></i> View Home
        </a>
      </div>`;
adminHtml = adminHtml.replace(adminHeaderNavOld, adminHeaderNavNew);

// Add Admin Session Script
if (!adminHtml.includes('function logoutAdmin()')) {
  const adminSessionScript = `
    function checkAdminAuthGate() {
      const isAdmin = localStorage.getItem('thakana_admin') || localStorage.getItem('thakana_admin_mode') === 'true';
      if (!isAdmin) {
        const banner = document.createElement('div');
        banner.className = 'bg-rose-900/90 text-rose-100 p-3 text-center text-xs font-bold border-b border-rose-700 flex items-center justify-center gap-3';
        banner.innerHTML = '<span>⚠️ Governance Session: You are viewing admin dashboard in read-only mode.</span> <a href="login-admin.html" class="px-2.5 py-1 bg-white text-rose-900 rounded-lg font-black hover:bg-rose-100 transition">Log In as Admin</a>';
        document.body.prepend(banner);
      }
    }

    function logoutAdmin() {
      localStorage.removeItem('thakana_admin');
      localStorage.removeItem('thakana_admin_mode');
      localStorage.removeItem('thakana_auth_user');
      window.location.href = 'login-admin.html';
    }

    window.addEventListener('DOMContentLoaded', checkAdminAuthGate);
  `;
  adminHtml = adminHtml.replace('</script>', adminSessionScript + '\n</script>');
}

fs.writeFileSync('public/admin-portal.html', adminHtml, 'utf8');
console.log('Updated public/admin-portal.html');


// -------------------------------------------------------------
// 4. UPDATE public/roommate-match.html
// -------------------------------------------------------------
let rmHtml = fs.readFileSync('public/roommate-match.html', 'utf8');
const rmTopBarOld = /<div class="text-\[11px\] font-semibold text-white\/70 hidden md:flex items-center gap-3 shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const rmTopBarNew = `<div class="flex items-center gap-2 shrink-0">
        <span class="text-white/50 text-[11px] hidden xl:inline">Portal Logins:</span>
        <div class="flex items-center gap-1 text-[11px] font-bold">
          <a href="login-user.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-graduation-cap text-[#826bbd]"></i> <span class="hidden sm:inline">Student</span>
          </a>
          <a href="login-owner.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-buildings text-amber-300"></i> <span class="hidden sm:inline">Owner</span>
          </a>
          <a href="login-admin.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
            <i class="ph-bold ph-shield-check text-rose-300"></i> <span class="hidden sm:inline">Admin</span>
          </a>
        </div>
      </div>
    </div>
  </div>`;
rmHtml = rmHtml.replace(rmTopBarOld, rmTopBarNew);
fs.writeFileSync('public/roommate-match.html', rmHtml, 'utf8');
console.log('Updated public/roommate-match.html');
