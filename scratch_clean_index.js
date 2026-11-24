const fs = require('fs');

let html = fs.readFileSync('d:/Thakana/public/index.html', 'utf8');

// 1. Remove the search bar section and the main hostels showcase section
// Find where search bar / hostelsSection starts
const searchSectionStart = '<!-- SEARCH BAR CAPSULE (ANCHORED BEFORE HOSTELS LISTING) -->';
const footerStart = '<footer class="bg-[#322d3a]'; // or existing footer

// Let's check how the footer starts
const splitParts = html.split('<footer class="');
if (splitParts.length < 2) {
  console.error('Footer not found!');
  process.exit(1);
}

// Check what's before searchSectionStart
const beforeSearch = splitParts[0].split(searchSectionStart)[0];

// Clean footer matching the new purple & slate design
const cleanFooter = `<footer class="bg-[#0F172A] text-white pt-14 pb-8 border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
        
        <!-- BRAND -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-[#4f39f6] text-white flex items-center justify-center text-xl font-black">
              <i class="ph-bold ph-house-line"></i>
            </div>
            <span class="text-2xl font-black tracking-tight text-white">Thikana</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Pakistan's premier verified student accommodation platform. Zero broker commission, verified university proximity, and 48-Hour Escrow protection.
          </p>
        </div>

        <!-- QUICK EXPLORE -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Popular Universities</h4>
          <ul class="space-y-2 text-xs text-slate-400">
            <li><button onclick="selectUniversityCard('UMT')" class="hover:text-white transition">UMT Lahore Hostels</button></li>
            <li><button onclick="selectUniversityCard('FAST')" class="hover:text-white transition">FAST-NUCES Hostels</button></li>
            <li><button onclick="selectUniversityCard('UCP')" class="hover:text-white transition">UCP Township Hostels</button></li>
            <li><button onclick="selectUniversityCard('PU')" class="hover:text-white transition">Punjab University Hostels</button></li>
            <li><button onclick="selectUniversityCard('LUMS')" class="hover:text-white transition">LUMS DHA Hostels</button></li>
            <li><button onclick="selectUniversityCard('COMSATS')" class="hover:text-white transition">COMSATS Hostels</button></li>
          </ul>
        </div>

        <!-- PORTALS -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Dedicated Portals</h4>
          <ul class="space-y-2 text-xs text-slate-400">
            <li><a href="login-student.html" class="hover:text-white transition flex items-center gap-1.5"><i class="ph-bold ph-graduation-cap text-[#4f39f6]"></i> Student Living Portal</a></li>
            <li><a href="login-owner.html" class="hover:text-white transition flex items-center gap-1.5"><i class="ph-bold ph-buildings text-amber-400"></i> Hostel Owner Portal</a></li>
            <li><a href="login-admin.html" class="hover:text-white transition flex items-center gap-1.5"><i class="ph-bold ph-shield-check text-rose-400"></i> Super Admin Governance</a></li>
            <li><a href="login-inspector.html" class="hover:text-white transition flex items-center gap-1.5"><i class="ph-bold ph-clipboard-text text-cyan-400"></i> Field Inspector Portal</a></li>
          </ul>
        </div>

        <!-- SAFETY & ESCROW -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Trust &amp; Safety</h4>
          <div class="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-400">
            <div class="flex items-center gap-2 text-white font-bold text-xs">
              <i class="ph-fill ph-shield-check text-[#4f39f6] text-base"></i>
              <span>48-Hour Deposit Escrow</span>
            </div>
            <p class="text-[11px] leading-relaxed">Your deposit is held safely in escrow until you check in and physically verify the property conditions.</p>
          </div>
        </div>

      </div>

      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>&copy; 2026 Thikana Pakistan. All rights reserved.</span>
        <span>Secure Student Accommodations &bull; Verified Supply</span>
      </div>
    </div>
  </footer>`;

// Replace script with updated selectUniversityCard logic
const scriptLogic = `
  <script>
    function togglePassVisibility(inputId, iconId) {
      const input = document.getElementById(inputId);
      const icon = document.getElementById(iconId);
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'ph-bold ph-eye-slash text-base';
      } else {
        input.type = 'password';
        icon.className = 'ph-bold ph-eye text-base';
      }
    }

    // Handle student clicking university card on front page
    function selectUniversityCard(uniName) {
      const userStr = localStorage.getItem('thakana_auth_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && (user.role === 'student' || user.role === 'user')) {
            window.location.href = 'user-dashboard.html?view=explore&uni=' + encodeURIComponent(uniName);
            return;
          }
        } catch(e) {}
      }
      // If not logged in, take them to dedicated Student Login with preloaded university
      window.location.href = 'login-student.html?uni=' + encodeURIComponent(uniName);
    }

    async function handleHomeStudentLogin(e) {
      e.preventDefault();
      const btn = document.getElementById('homeLoginBtn');
      const alertEl = document.getElementById('homeAuthAlert');
      alertEl.classList.add('hidden');
      btn.disabled = true;
      btn.innerHTML = '<i class=\"ph-bold ph-spinner animate-spin text-sm\"></i> Authenticating...';

      const identifier = document.getElementById('homeLoginEmail').value.trim();
      const password = document.getElementById('homeLoginPass').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, role: 'student' })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          alertEl.className = 'mb-3 p-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block';
          alertEl.innerHTML = '<i class=\"ph-bold ph-check-circle\"></i> Login successful! Loading dashboard...';
          if (data.token) localStorage.setItem('thakana_jwt_token', data.token);
          if (data.user) localStorage.setItem('thakana_auth_user', JSON.stringify(data.user));

          const targetUni = new URLSearchParams(window.location.search).get('uni');
          const dest = targetUni ? 'user-dashboard.html?view=explore&uni=' + encodeURIComponent(targetUni) : 'user-dashboard.html';
          setTimeout(() => {
            window.location.href = dest;
          }, 600);
        } else {
          alertEl.className = 'mb-3 p-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block';
          alertEl.innerHTML = '<i class=\"ph-bold ph-warning-circle\"></i> ' + (data.message || 'Student login failed.');
          btn.disabled = false;
          btn.innerHTML = '<span>Login</span> <i class=\"ph-bold ph-arrow-right\"></i>';
        }
      } catch (err) {
        alertEl.className = 'mb-3 p-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 block';
        alertEl.innerHTML = '<i class=\"ph-bold ph-warning-circle\"></i> Network error. Please try again.';
        btn.disabled = false;
        btn.innerHTML = '<span>Login</span> <i class=\"ph-bold ph-arrow-right\"></i>';
      }
    }

    function syncHeroLoginCard() {
      const userStr = localStorage.getItem('thakana_auth_user');
      const form = document.getElementById('homeLoginForm');
      const box = document.getElementById('homeLoggedInBox');
      if (!form || !box) return;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.name) {
            form.classList.add('hidden');
            box.classList.remove('hidden');
            document.getElementById('homeLoggedInName').textContent = user.name;
            document.getElementById('homeLoggedInEmail').textContent = user.email || user.phone || '';
            const dashLink = document.getElementById('homeDashboardLink');
            if (user.role === 'owner') {
              dashLink.href = 'owner-portal.html';
              dashLink.innerHTML = '<span>Go to Owner Dashboard</span> <i class=\"ph-bold ph-arrow-right\"></i>';
            } else if (user.role === 'admin') {
              dashLink.href = 'admin-portal.html';
              dashLink.innerHTML = '<span>Go to Admin Dashboard</span> <i class=\"ph-bold ph-arrow-right\"></i>';
            } else {
              dashLink.href = 'user-dashboard.html';
              dashLink.innerHTML = '<span>Go to Student Dashboard</span> <i class=\"ph-bold ph-arrow-right\"></i>';
            }
          }
        } catch (e) {}
      }
    }

    function toggleMobileMenu(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      const drawer = document.getElementById('mobileDrawer');
      const backdrop = document.getElementById('mobileBackdrop');
      if (!drawer) return;
      if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
        if (backdrop) backdrop.classList.remove('hidden');
      } else {
        drawer.classList.add('hidden');
        if (backdrop) backdrop.classList.add('hidden');
      }
    }

    function closeMobileMenu() {
      const drawer = document.getElementById('mobileDrawer');
      const backdrop = document.getElementById('mobileBackdrop');
      if (drawer) drawer.classList.add('hidden');
      if (backdrop) backdrop.classList.add('hidden');
    }

    function logoutAuthUser() {
      localStorage.removeItem('thakana_auth_user');
      localStorage.removeItem('thakana_jwt_token');
      localStorage.removeItem('thakana_user');
      fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
        window.location.reload();
      });
    }

    window.addEventListener('DOMContentLoaded', syncHeroLoginCard);
  </script>
</body>
</html>`;

const newIndexHtml = beforeSearch + '\n' + cleanFooter + '\n' + scriptLogic;
fs.writeFileSync('d:/Thakana/public/index.html', newIndexHtml, 'utf8');
console.log('Successfully updated public/index.html: Removed public hostels from front page, kept clean hero and university cards!');
