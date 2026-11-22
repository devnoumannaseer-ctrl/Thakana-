const fs = require('fs');
let html = fs.readFileSync('public/login.html', 'utf8');

// 1. Add tab CSS for inspector
html = html.replace('.tab-btn-admin.active {', `.tab-btn-inspector.active {
      background: #0284c7;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
    }
    .tab-btn-admin.active {`);

// 2. Add inspector link to top bar
html = html.replace(
  '<a href="admin-portal.html" class="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition shrink-0">\n          <i class="ph-bold ph-shield-check"></i> <span>3. Admin Side</span>\n        </a>',
  `<a href="inspector-portal.html" class="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition shrink-0">
          <i class="ph-bold ph-crosshair text-cyan-300"></i> <span>3. Inspector Side</span>
        </a>
        <a href="admin-portal.html" class="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition shrink-0">
          <i class="ph-bold ph-shield-check text-rose-300"></i> <span>4. Admin Side</span>
        </a>`
);

// 3. Add tab button for inspector in 4-role switcher
const oldTabs = `<div class="bg-[#f0edfb] p-1.5 rounded-2xl flex items-center justify-between mb-6 text-xs font-bold gap-1">
        <button id="tabStudent" onclick="switchRole('student')" class="tab-btn flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 active text-[#5f4a9a]">
          <i class="ph-bold ph-graduation-cap text-sm"></i>
          <span>Student</span>
        </button>
        <button id="tabOwner" onclick="switchRole('owner')" class="tab-btn flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900">
          <i class="ph-bold ph-buildings text-sm"></i>
          <span>Owner</span>
        </button>
        <button id="tabAdmin" onclick="switchRole('admin')" class="tab-btn flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900">
          <i class="ph-bold ph-shield-check text-sm"></i>
          <span>Admin</span>
        </button>
      </div>`;

const newTabs = `<div class="bg-[#f0edfb] p-1 rounded-2xl grid grid-cols-4 mb-6 text-[11px] font-bold gap-1">
        <button id="tabStudent" onclick="switchRole('student')" class="tab-btn py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 active text-[#5f4a9a]">
          <i class="ph-bold ph-graduation-cap text-sm"></i>
          <span>Student</span>
        </button>
        <button id="tabOwner" onclick="switchRole('owner')" class="tab-btn py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 text-slate-600 hover:text-slate-900">
          <i class="ph-bold ph-buildings text-sm"></i>
          <span>Owner</span>
        </button>
        <button id="tabInspector" onclick="switchRole('inspector')" class="tab-btn py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 text-slate-600 hover:text-slate-900">
          <i class="ph-bold ph-crosshair text-sm"></i>
          <span>Inspector</span>
        </button>
        <button id="tabAdmin" onclick="switchRole('admin')" class="tab-btn py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 text-slate-600 hover:text-slate-900">
          <i class="ph-bold ph-shield-check text-sm"></i>
          <span>Admin</span>
        </button>
      </div>`;

html = html.replace(oldTabs, newTabs);

// 4. Update switchRole in script
const oldSwitchRoleStart = `    function switchRole(role) {
      currentRole = role;
      
      const tabStudent = document.getElementById('tabStudent');
      const tabOwner = document.getElementById('tabOwner');
      const tabAdmin = document.getElementById('tabAdmin');`;

const newSwitchRoleStart = `    function switchRole(role) {
      currentRole = role;
      
      const tabStudent = document.getElementById('tabStudent');
      const tabOwner = document.getElementById('tabOwner');
      const tabInspector = document.getElementById('tabInspector');
      const tabAdmin = document.getElementById('tabAdmin');`;

html = html.replace(oldSwitchRoleStart, newSwitchRoleStart);

// Reset tabs line
html = html.replace(
  `[tabStudent, tabOwner, tabAdmin].forEach(t => {`,
  `[tabStudent, tabOwner, tabInspector, tabAdmin].forEach(t => {`
);

// Add Inspector branch in switchRole
const inspectorRoleBranch = `      else if (role === 'inspector') {
        if (tabInspector) tabInspector.className = 'tab-btn tab-btn-inspector active py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 font-bold';
        badgeBox.className = 'mb-5 p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-3';
        badgeIcon.className = 'w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center text-lg font-black shrink-0';
        badgeIcon.innerHTML = '<i class="ph-bold ph-crosshair"></i>';
        badgeTitle.innerText = 'Field Quality Inspector Access';
        badgeDesc.innerText = '50-Point physical inspections, GPS geo-audit & verification rating';
        
        lblIdentifier.innerText = 'Inspector Official Email or ID';
        inputIdentifier.placeholder = 'inspector@thakana.pk';
        iconIdentifier.className = 'ph-bold ph-crosshair text-base text-sky-600';
        hintPassword.innerText = 'Default: inspector123';
        
        uniGroup.classList.add('hidden');
        hostelGroup.classList.add('hidden');
        admin2faGroup.classList.add('hidden');
        
        submitBtn.className = 'w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white bg-sky-600 hover:bg-sky-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2';
        submitBtnText.innerText = 'Sign In to Inspector Portal';
        demoHintBox.innerHTML = '<span>Inspector: <strong class="text-slate-700">inspector@thakana.pk</strong></span><span class="font-mono text-slate-600">pass: inspector123</span>';
      }
      else if (role === 'admin') {`;

html = html.replace(`      else if (role === 'admin') {`, inspectorRoleBranch);

// Update autoFillDemo for inspector
html = html.replace(
  `else if (currentRole === 'admin') {`,
  `else if (currentRole === 'inspector') {
        inputIdentifier.value = 'inspector@thakana.pk';
        inputPassword.value = 'inspector123';
      } else if (currentRole === 'admin') {`
);

// Update handleAuthSubmit redirect for inspector
html = html.replace(
  `else if (currentRole === 'admin') {`,
  `else if (currentRole === 'inspector') {
            localStorage.setItem('thakana_inspector', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'inspector-portal.html'; }, 800);
          } else if (currentRole === 'admin') {`
);

// Update fallback in catch block
html = html.replace(
  `else if (currentRole === 'admin') {\n          localStorage.setItem('thakana_admin', JSON.stringify(localUser));`,
  `else if (currentRole === 'inspector') {
          localStorage.setItem('thakana_inspector', JSON.stringify(localUser));
          setTimeout(() => { window.location.href = 'inspector-portal.html'; }, 800);
        } else if (currentRole === 'admin') {\n          localStorage.setItem('thakana_admin', JSON.stringify(localUser));`
);

// Update direct links in footer of login card
html = html.replace(
  `<a href="login-owner.html" class="hover:underline">Owner Login</a>\n          <span>&bull;</span>\n          <a href="login-admin.html" class="hover:underline">Admin Login</a>`,
  `<a href="login-owner.html" class="hover:underline">Owner Login</a>\n          <span>&bull;</span>\n          <a href="login-inspector.html" class="hover:underline">Inspector Login</a>\n          <span>&bull;</span>\n          <a href="login-admin.html" class="hover:underline">Admin Login</a>`
);

// Update initRoleFromUrl for inspector
html = html.replace(
  `if (r === 'owner' || window.location.pathname.includes('owner')) {\n        switchRole('owner');\n      } else if (r === 'admin' || window.location.pathname.includes('admin')) {`,
  `if (r === 'owner' || window.location.pathname.includes('owner')) {
        switchRole('owner');
      } else if (r === 'inspector' || window.location.pathname.includes('inspector')) {
        switchRole('inspector');
      } else if (r === 'admin' || window.location.pathname.includes('admin')) {`
);

fs.writeFileSync('public/login.html', html, 'utf8');
console.log('Successfully updated public/login.html for all 4 roles!');
