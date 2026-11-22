const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// Update syncUserAuthHeader
const oldSyncHeader = `    // User Auth Header Sync
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
    }`;

const newSyncHeader = `    // User Auth Header Sync with Strict Role Separation
    function syncUserAuthHeader() {
      const authSlot = document.getElementById('userAuthSlot');
      const mobileSlot = document.getElementById('mobileAuthSlot');
      const adminBtn = document.getElementById('adminModeBtn');

      let user = null;
      try {
        const uStr = localStorage.getItem('thakana_user') || localStorage.getItem('thakana_auth_user');
        if (uStr) user = JSON.parse(uStr);
      } catch (e) {}

      // RBAC: Hide Admin Toggle for all non-admin users
      if (adminBtn) {
        if (user && user.role === 'admin') {
          adminBtn.style.display = 'inline-flex';
        } else {
          adminBtn.style.display = 'none';
        }
      }

      if (user && user.name) {
        const role = user.role || 'student';
        let dashboardLink = 'user-dashboard.html';
        let dashboardLabel = 'My Dashboard';
        let roleIcon = 'ph-bold ph-graduation-cap text-emerald-300';

        if (role === 'owner') {
          dashboardLink = 'owner-portal.html';
          dashboardLabel = 'Owner Dashboard';
          roleIcon = 'ph-bold ph-buildings text-amber-300';
        } else if (role === 'inspector') {
          dashboardLink = 'inspector-portal.html';
          dashboardLabel = 'Inspector Portal';
          roleIcon = 'ph-bold ph-crosshair text-cyan-300';
        } else if (role === 'admin') {
          dashboardLink = 'admin-portal.html';
          dashboardLabel = 'Admin Portal';
          roleIcon = 'ph-bold ph-shield-check text-rose-300';
        }

        if (authSlot) {
          authSlot.innerHTML = \`
            <div class="inline-flex items-center gap-1.5">
              <a href="\${dashboardLink}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/25 shadow-sm hover:bg-white/30 transition">
                <i class="\${roleIcon} text-sm"></i>
                <span>\${user.name.split(' ')[0]} (\${dashboardLabel})</span>
              </a>
              <button onclick="logoutAuthUser(event)" class="px-2 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-300/30 text-xs font-bold transition" title="Logout">
                <i class="ph-bold ph-sign-out"></i>
              </button>
            </div>
          \`;
        }
        if (mobileSlot) {
          mobileSlot.innerHTML = \`
            <div class="p-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold space-y-2">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5"><i class="\${roleIcon} text-base"></i> \${user.name}</span>
                <span class="text-[10px] uppercase font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">\${role}</span>
              </div>
              <div class="flex items-center gap-2 pt-1 border-t border-white/10">
                <a href="\${dashboardLink}" class="flex-1 py-1.5 text-center bg-[#5f4a9a] rounded-lg font-bold text-white text-xs hover:bg-[#4d3b7e]">
                  Go to \${dashboardLabel}
                </a>
                <button onclick="logoutAuthUser(event)" class="px-3 py-1.5 text-rose-300 font-bold hover:underline text-xs">
                  Logout
                </button>
              </div>
            </div>
          \`;
        }
      } else {
        if (authSlot) {
          authSlot.innerHTML = \`
            <a href="login.html" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition">
              <i class="ph-bold ph-sign-in"></i> <span>Login / Portal</span>
            </a>
          \`;
        }
        if (mobileSlot) {
          mobileSlot.innerHTML = \`
            <a href="login.html" class="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition">
              <span class="flex items-center gap-2"><i class="ph-bold ph-sign-in text-base text-[#826bbd]"></i> Portals Login / Sign Up</span>
              <i class="ph-bold ph-caret-right text-xs"></i>
            </a>
          \`;
        }
      }
    }`;

html = html.replace(oldSyncHeader, newSyncHeader);

// In desktop nav, hide adminModeBtn by default
html = html.replace(
  'id="adminModeBtn" onclick="toggleAdminMode()" class="inline-flex',
  'id="adminModeBtn" onclick="toggleAdminMode()" style="display:none;" class="inline-flex'
);

// In mobile drawer, hide manual admin toggle
html = html.replace(
  '<button onclick="toggleAdminMode(); closeMobileMenu();" class="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-amber-500/20 text-amber-200">',
  '<button id="mobileAdminToggleBtn" onclick="toggleAdminMode(); closeMobileMenu();" style="display:none;" class="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-amber-500/20 text-amber-200">'
);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Updated public/index.html auth sync & RBAC visibility');
