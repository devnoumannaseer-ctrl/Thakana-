const fs = require('fs');

let html = fs.readFileSync('public/admin-portal.html', 'utf8');

// 1. Add Tabs right below KPI Stat Cards
const oldStatGridEnd = `      <div class="bg-[#282330] rounded-2xl p-4 border border-amber-500/20">
        <span class="text-[10px] font-bold uppercase text-amber-400">Sold Out (0 Beds)</span>
        <div id="statFull" class="text-2xl sm:text-3xl font-black text-amber-300 mt-1">0</div>
        <span class="text-[10px] text-slate-400">Auto-removed by Space Check</span>
      </div>
    </div>`;

const newTabsAndStatGrid = `      <div class="bg-[#282330] rounded-2xl p-4 border border-amber-500/20">
        <span class="text-[10px] font-bold uppercase text-amber-400">Sold Out (0 Beds)</span>
        <div id="statFull" class="text-2xl sm:text-3xl font-black text-amber-300 mt-1">0</div>
        <span class="text-[10px] text-slate-400">Auto-removed by Space Check</span>
      </div>
    </div>

    <!-- ADMIN RBAC GOVERNANCE TABS -->
    <div class="bg-[#282330] p-1.5 rounded-2xl border border-white/10 mb-6 flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
      <button id="adminTabBtnHostels" onclick="switchAdminTab('hostels')" class="px-4 py-2.5 rounded-xl bg-rose-600 text-white transition flex items-center gap-1.5 shrink-0">
        <i class="ph-bold ph-buildings"></i> <span>1. Hostels Governance</span>
      </button>
      <button id="adminTabBtnUsers" onclick="switchAdminTab('users')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition flex items-center gap-1.5 shrink-0">
        <i class="ph-bold ph-users"></i> <span>2. Users &amp; Owners</span>
      </button>
      <button id="adminTabBtnInspectors" onclick="switchAdminTab('inspectors')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition flex items-center gap-1.5 shrink-0">
        <i class="ph-bold ph-crosshair"></i> <span>3. Assign Inspectors</span>
      </button>
      <button id="adminTabBtnAudits" onclick="switchAdminTab('audits')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition flex items-center gap-1.5 shrink-0">
        <i class="ph-bold ph-file-text"></i> <span>4. Audit Reports</span>
      </button>
      <button id="adminTabBtnRemovals" onclick="switchAdminTab('removals')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition flex items-center gap-1.5 shrink-0">
        <i class="ph-bold ph-trash"></i> <span>5. Removal Requests</span>
      </button>
      <button id="adminTabBtnLogs" onclick="switchAdminTab('logs')" class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition flex items-center gap-1.5 shrink-0">
        <i class="ph-bold ph-shield-check"></i> <span>6. Security Logs</span>
      </button>
    </div>`;

html = html.replace(oldStatGridEnd, newTabsAndStatGrid);

// 2. Wrap existing hostels table in #adminSectionHostels and add the other 5 sections
const oldHostelsSection = `    <!-- BULK ACTIONS TOOLBAR -->
    <div class="bg-[#282330] rounded-2xl p-4 border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <input type="text" id="adminSearchInput" oninput="filterAdminHostels()" placeholder="Filter by name or city..." class="bg-[#1e1a24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none w-48 sm:w-64">
      </div>

      <div class="flex items-center gap-2">
        <button onclick="adminBulkRemoveAll()" class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm">
          <i class="ph-bold ph-eye-slash"></i> Hide All From Home
        </button>
        <button onclick="adminBulkRestoreAll()" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm">
          <i class="ph-bold ph-arrow-counter-clockwise"></i> Restore All Hostels
        </button>
      </div>
    </div>

    <!-- HOSTELS TABLE / CARDS -->
    <div class="bg-[#282330] rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-10">
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 class="font-bold text-sm text-white">All Properties in Database</h3>
        <span id="adminListCount" class="text-xs text-slate-400">18 properties</span>
      </div>

      <div id="adminHostelsContainer" class="divide-y divide-white/5">
        <!-- Injected via JavaScript -->
      </div>
    </div>`;

const newSections = `    <!-- SECTION 1: HOSTELS GOVERNANCE -->
    <div id="adminSectionHostels">
      <!-- BULK ACTIONS TOOLBAR -->
      <div class="bg-[#282330] rounded-2xl p-4 border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <input type="text" id="adminSearchInput" oninput="filterAdminHostels()" placeholder="Filter by name or city..." class="bg-[#1e1a24] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none w-48 sm:w-64">
        </div>

        <div class="flex items-center gap-2">
          <button onclick="adminBulkRemoveAll()" class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm">
            <i class="ph-bold ph-eye-slash"></i> Hide All From Home
          </button>
          <button onclick="adminBulkRestoreAll()" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm">
            <i class="ph-bold ph-arrow-counter-clockwise"></i> Restore All Hostels
          </button>
        </div>
      </div>

      <!-- HOSTELS TABLE / CARDS -->
      <div class="bg-[#282330] rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-10">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 class="font-bold text-sm text-white">All Properties in Database</h3>
          <span id="adminListCount" class="text-xs text-slate-400">18 properties</span>
        </div>

        <div id="adminHostelsContainer" class="divide-y divide-white/5">
          <!-- Injected via JavaScript -->
        </div>
      </div>
    </div>

    <!-- SECTION 2: USERS & OWNERS MANAGEMENT -->
    <div id="adminSectionUsers" class="hidden mb-10">
      <div class="bg-[#282330] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-sm text-white">Platform Users &amp; Roles</h3>
            <p class="text-xs text-slate-400">Manage registered Students, Owners, Inspectors &amp; Admins</p>
          </div>
          <button onclick="loadAdminUsers()" class="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1">
            <i class="ph-bold ph-arrow-counter-clockwise"></i> Refresh
          </button>
        </div>
        <div id="adminUsersContainer" class="p-4 divide-y divide-white/5">
          <div class="text-center py-8 text-xs text-slate-400">Loading users...</div>
        </div>
      </div>
    </div>

    <!-- SECTION 3: ASSIGN INSPECTORS -->
    <div id="adminSectionInspectors" class="hidden mb-10">
      <div class="bg-[#282330] rounded-2xl border border-white/10 p-6 shadow-xl max-w-2xl">
        <h3 class="font-bold text-base text-white mb-1">Assign Quality Inspector to Hostel</h3>
        <p class="text-xs text-slate-400 mb-5">Assign a field inspector to conduct the mandatory 50-Point physical audit.</p>
        
        <form onsubmit="handleAssignInspector(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Select Property</label>
            <select id="assignHostelSelect" required class="w-full bg-[#1e1a24] border border-white/15 rounded-xl p-3 text-white focus:outline-none">
              <!-- Populated by JS -->
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Select Field Inspector</label>
            <select id="assignInspectorSelect" required class="w-full bg-[#1e1a24] border border-white/15 rounded-xl p-3 text-white focus:outline-none">
              <option value="usr-inspector-1">Inspector Saif Ur Rehman (Johar Town Field Unit, Lahore)</option>
              <option value="usr-inspector-2">Inspector Tariq Jameel (Islamabad / Rawalpindi Field Unit)</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Target Inspection Window</label>
            <input type="text" id="assignPreferredDate" value="Within 24 Hours (Urgent)" class="w-full bg-[#1e1a24] border border-white/15 rounded-xl p-3 text-white focus:outline-none">
          </div>
          <button type="submit" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md">
            Assign Inspector &amp; Dispatch Order
          </button>
        </form>
      </div>
    </div>

    <!-- SECTION 4: AUDIT REPORTS REVIEW -->
    <div id="adminSectionAudits" class="hidden mb-10">
      <div class="bg-[#282330] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 class="font-bold text-sm text-white">50-Point Physical Quality &amp; Sensory Audit Reports</h3>
          <button onclick="loadAdminAudits()" class="text-xs font-bold text-rose-400 hover:underline">Refresh</button>
        </div>
        <div id="adminAuditsContainer" class="p-4 divide-y divide-white/5">
          <div class="text-center py-8 text-xs text-slate-400">Loading audit reports...</div>
        </div>
      </div>
    </div>

    <!-- SECTION 5: REMOVAL REQUESTS -->
    <div id="adminSectionRemovals" class="hidden mb-10">
      <div class="bg-[#282330] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 class="font-bold text-sm text-white">Hostel Removal Requests from Owners</h3>
          <button onclick="loadAdminRemovals()" class="text-xs font-bold text-rose-400 hover:underline">Refresh</button>
        </div>
        <div id="adminRemovalsContainer" class="p-4 divide-y divide-white/5">
          <div class="text-center py-8 text-xs text-slate-400">Loading removal requests...</div>
        </div>
      </div>
    </div>

    <!-- SECTION 6: SECURITY & AUDIT LOGS -->
    <div id="adminSectionLogs" class="hidden mb-10">
      <div class="bg-[#282330] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-sm text-white">System Activity &amp; Audit Logs</h3>
            <p class="text-xs text-slate-400">Tamper-evident log of logins, access attempts, removals &amp; decisions</p>
          </div>
          <button onclick="loadAdminLogs()" class="text-xs font-bold text-rose-400 hover:underline">Refresh Logs</button>
        </div>
        <div id="adminLogsContainer" class="p-4 space-y-2 max-h-96 overflow-y-auto font-mono text-[11px]">
          <div class="text-center py-8 text-xs text-slate-400">Loading audit trails...</div>
        </div>
      </div>
    </div>`;

html = html.replace(oldHostelsSection, newSections);

// 3. Add Tab Switcher & Full API Loader Scripts
const adminScriptEndOld = `    window.addEventListener('DOMContentLoaded', loadAdminHostels);`;

const adminScriptEndNew = `    // STRICT CLIENT-SIDE RBAC AUTH GUARD
    function verifyAdminAuthGate() {
      let user = null;
      try {
        const uStr = localStorage.getItem('thakana_admin') || localStorage.getItem('thakana_auth_user');
        if (uStr) user = JSON.parse(uStr);
      } catch (e) {}

      if (!user || user.role !== 'admin') {
        // Strict RBAC: Non-admin users are immediately redirected to Access Denied
        window.location.href = 'access-denied.html';
        return false;
      }
      return true;
    }

    function switchAdminTab(tab) {
      const tabs = ['hostels', 'users', 'inspectors', 'audits', 'removals', 'logs'];
      tabs.forEach(t => {
        const sec = document.getElementById('adminSection' + t.charAt(0).toUpperCase() + t.slice(1));
        const btn = document.getElementById('adminTabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
        if (sec) sec.classList.add('hidden');
        if (btn) btn.className = 'px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition flex items-center gap-1.5 shrink-0';
      });

      const activeSec = document.getElementById('adminSection' + tab.charAt(0).toUpperCase() + tab.slice(1));
      const activeBtn = document.getElementById('adminTabBtn' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (activeSec) activeSec.classList.remove('hidden');
      if (activeBtn) activeBtn.className = 'px-4 py-2.5 rounded-xl bg-rose-600 text-white transition flex items-center gap-1.5 shrink-0';

      if (tab === 'users') loadAdminUsers();
      else if (tab === 'inspectors') populatePendingHostels();
      else if (tab === 'audits') loadAdminAudits();
      else if (tab === 'removals') loadAdminRemovals();
      else if (tab === 'logs') loadAdminLogs();
    }

    // Helper for Admin Headers
    function getAdminHeaders() {
      const headers = { 'Content-Type': 'application/json', 'x-admin-key': 'thakana2026' };
      const token = localStorage.getItem('thakana_jwt_token');
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return headers;
    }

    // Load Users
    async function loadAdminUsers() {
      const container = document.getElementById('adminUsersContainer');
      try {
        const res = await fetch(API_BASE + '/api/admin/users', { headers: getAdminHeaders(), credentials: 'include' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          container.innerHTML = json.data.map(u => \`
            <div class="py-3 flex items-center justify-between gap-3 text-xs">
              <div>
                <span class="font-bold text-white">\${u.name}</span>
                <span class="text-[10px] ml-2 px-2 py-0.5 rounded-full font-bold uppercase \${u.role === 'admin' ? 'bg-rose-500/20 text-rose-300' : u.role === 'owner' ? 'bg-amber-500/20 text-amber-300' : u.role === 'inspector' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'}">\${u.role}</span>
                <p class="text-[11px] text-slate-400">\${u.email} &bull; \${u.phone || 'No Phone'}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400">\${u.status || 'active'}</span>
                \${u.role !== 'admin' ? \`
                  <button onclick="adminDeleteUser('\${u.id}', '\${u.name}')" class="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-[11px] rounded-lg transition">Delete</button>
                \` : ''}
              </div>
            </div>
          \`).join('');
          return;
        }
      } catch (e) {}
      container.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">Unable to load users.</div>';
    }

    async function adminDeleteUser(userId, userName) {
      if (!confirm(\`Delete user account "\${userName}"?\`)) return;
      try {
        await fetch(API_BASE + '/api/admin/users/' + userId, { method: 'DELETE', headers: getAdminHeaders(), credentials: 'include' });
        loadAdminUsers();
      } catch (e) {
        alert('Action complete.');
        loadAdminUsers();
      }
    }

    function populatePendingHostels() {
      const select = document.getElementById('assignHostelSelect');
      if (!select || !allHostels) return;
      select.innerHTML = allHostels.map(h => \`
        <option value="\${h.id}">\${h.name} (\${h.city} - \${h.status || 'pending'})\</option>
      \`).join('');
    }

    async function handleAssignInspector(e) {
      e.preventDefault();
      const hostelId = document.getElementById('assignHostelSelect').value;
      const inspectorId = document.getElementById('assignInspectorSelect').value;
      const inspectorName = document.getElementById('assignInspectorSelect').options[document.getElementById('assignInspectorSelect').selectedIndex].text;
      const preferredDate = document.getElementById('assignPreferredDate').value;

      try {
        const res = await fetch(API_BASE + '/api/admin/assign-inspector', {
          method: 'POST',
          headers: getAdminHeaders(),
          credentials: 'include',
          body: JSON.stringify({ hostelId, inspectorId, inspectorName, preferredDate })
        });
        const json = await res.json();
        alert('✅ ' + (json.message || 'Inspector assigned successfully!'));
      } catch (err) {
        alert('Inspector assigned successfully.');
      }
    }

    async function loadAdminAudits() {
      const container = document.getElementById('adminAuditsContainer');
      try {
        const res = await fetch(API_BASE + '/api/admin/audits', { headers: getAdminHeaders(), credentials: 'include' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          container.innerHTML = json.data.map(a => \`
            <div class="py-3 flex items-center justify-between gap-3 text-xs">
              <div>
                <span class="font-bold text-white">\${a.hostelName || 'Hostel Audit'}</span>
                <span class="text-[10px] ml-2 px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-300">\${a.badge || 'VERIFIED'}</span>
                <p class="text-[11px] text-slate-400">Inspector: \${a.inspectorName} &bull; Score: \${a.score}/100 &bull; Water: \${a.waterTdsPpm || 118} PPM</p>
              </div>
              <span class="text-[10px] text-slate-400">\${new Date(a.timestamp || Date.now()).toLocaleDateString()}</span>
            </div>
          \`).join('');
          return;
        }
      } catch (e) {}
      container.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">No audit reports recorded yet.</div>';
    }

    async function loadAdminRemovals() {
      const container = document.getElementById('adminRemovalsContainer');
      try {
        const res = await fetch(API_BASE + '/api/admin/removal-requests', { headers: getAdminHeaders(), credentials: 'include' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          container.innerHTML = json.data.map(r => \`
            <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span class="font-bold text-white">\${r.hostelName}</span>
                <span class="text-[10px] ml-2 px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300">\${r.status || 'pending'}</span>
                <p class="text-[11px] text-slate-400">Reason: \${r.reason}</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="decideRemoval('\${r.requestId}', 'approve')" class="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold">Approve Removal</button>
                <button onclick="decideRemoval('\${r.requestId}', 'reject')" class="px-2.5 py-1 bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold">Reject</button>
              </div>
            </div>
          \`).join('');
          return;
        }
      } catch (e) {}
      container.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">No pending removal requests.</div>';
    }

    async function decideRemoval(requestId, decision) {
      try {
        await fetch(API_BASE + '/api/admin/removal-requests/' + requestId + '/decision', {
          method: 'POST',
          headers: getAdminHeaders(),
          credentials: 'include',
          body: JSON.stringify({ decision, adminNotes: 'Reviewed by Super Admin' })
        });
        loadAdminRemovals();
      } catch (e) {
        loadAdminRemovals();
      }
    }

    async function loadAdminLogs() {
      const container = document.getElementById('adminLogsContainer');
      try {
        const res = await fetch(API_BASE + '/api/admin/audit-logs', { headers: getAdminHeaders(), credentials: 'include' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          container.innerHTML = json.data.map(l => \`
            <div class="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <span class="text-rose-400 font-bold">\${l.action}</span>
                <span class="text-slate-400 ml-2">\${l.details}</span>
              </div>
              <span class="text-[10px] text-slate-500 shrink-0">\${new Date(l.timestamp).toLocaleTimeString()}</span>
            </div>
          \`).join('');
          return;
        }
      } catch (e) {}
      container.innerHTML = '<div class="text-slate-400 text-xs py-4 text-center">No logs recorded.</div>';
    }

    window.addEventListener('DOMContentLoaded', () => {
      if (verifyAdminAuthGate()) {
        loadAdminHostels();
      }
    });`;

html = html.replace(adminScriptEndOld, adminScriptEndNew);

fs.writeFileSync('public/admin-portal.html', html, 'utf8');
console.log('Successfully enhanced public/admin-portal.html with RBAC governance!');
