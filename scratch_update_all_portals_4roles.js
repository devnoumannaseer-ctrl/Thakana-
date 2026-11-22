const fs = require('fs');

// Helper to replace the 3-sided switcher with 4-sided switcher
function updateGlobalSwitcher(file, activeRole) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  const oldSwitcherPattern = /<!-- 3-SIDED PLATFORM GLOBAL SWITCHER BAR -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  
  const getBadge = (role, label, icon, link, color) => {
    if (role === activeRole) {
      return `<a href="${link}" class="px-2.5 py-1 rounded-full ${color} text-white font-bold flex items-center gap-1 shadow-sm shrink-0">
          <i class="${icon}"></i> <span>${label} [Active]</span>
        </a>`;
    }
    return `<a href="${link}" class="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center gap-1 transition shrink-0">
          <i class="${icon}"></i> <span>${label}</span>
        </a>`;
  };

  const newSwitcher = `<!-- 4-ROLE PLATFORM GLOBAL SWITCHER BAR -->
  <div class="bg-[#1e1a24] text-white py-2 px-3 sm:px-6 border-b border-white/10 text-xs relative z-50">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5 sm:gap-2 text-[11px] font-bold overflow-x-auto no-scrollbar">
        <span class="text-white/60 hidden sm:inline">Role Access:</span>
        ${getBadge('student', '1. Student', 'ph-bold ph-graduation-cap text-[#826bbd]', 'index.html', 'bg-[#5f4a9a]')}
        ${getBadge('owner', '2. Owner', 'ph-bold ph-buildings text-amber-300', 'owner-portal.html', 'bg-amber-600')}
        ${getBadge('inspector', '3. Inspector', 'ph-bold ph-crosshair text-cyan-300', 'inspector-portal.html', 'bg-cyan-600')}
        ${getBadge('admin', '4. Admin', 'ph-bold ph-shield-check text-rose-300', 'admin-portal.html', 'bg-rose-600')}
      </div>
      <div class="flex items-center gap-1.5 shrink-0 text-[11px] font-bold">
        <span class="text-white/50 hidden xl:inline">Portals Login:</span>
        <a href="login-user.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
          <i class="ph-bold ph-graduation-cap text-[#826bbd]"></i> <span class="hidden sm:inline">Student</span>
        </a>
        <a href="login-owner.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
          <i class="ph-bold ph-buildings text-amber-300"></i> <span class="hidden sm:inline">Owner</span>
        </a>
        <a href="login-inspector.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
          <i class="ph-bold ph-crosshair text-cyan-300"></i> <span class="hidden sm:inline">Inspector</span>
        </a>
        <a href="login-admin.html" class="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1">
          <i class="ph-bold ph-shield-check text-rose-300"></i> <span class="hidden sm:inline">Admin</span>
        </a>
      </div>
    </div>
  </div>`;

  if (oldSwitcherPattern.test(content)) {
    content = content.replace(oldSwitcherPattern, newSwitcher);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated switcher in:', file);
  } else if (!content.includes('4-ROLE PLATFORM GLOBAL SWITCHER BAR')) {
    // Add right after body tag if missing
    content = content.replace(/<body[^>]*>/, match => match + '\n' + newSwitcher);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Injected switcher in:', file);
  }
}

updateGlobalSwitcher('public/index.html', 'student');
updateGlobalSwitcher('public/owner-portal.html', 'owner');
updateGlobalSwitcher('public/inspector-portal.html', 'inspector');
updateGlobalSwitcher('public/admin-portal.html', 'admin');
updateGlobalSwitcher('public/roommate-match.html', 'student');
updateGlobalSwitcher('public/login.html', '');

// Update inspector portal header to show logged in inspector session
let insHtml = fs.readFileSync('public/inspector-portal.html', 'utf8');
if (!insHtml.includes('syncInspectorSession')) {
  const inspectorSessionScript = `
    function syncInspectorSession() {
      let inspector = null;
      try {
        const iStr = localStorage.getItem('thakana_inspector') || localStorage.getItem('thakana_auth_user');
        if (iStr) inspector = JSON.parse(iStr);
      } catch (e) {}

      const nameInput = document.getElementById('inspectorName');
      if (inspector && inspector.name && nameInput) {
        nameInput.value = inspector.name + ' (' + (inspector.fieldUnit || 'Field Unit') + ')';
      }
    }
    window.addEventListener('DOMContentLoaded', syncInspectorSession);
  `;
  insHtml = insHtml.replace('</head>', '<script>' + inspectorSessionScript + '</script>\n</head>');
  fs.writeFileSync('public/inspector-portal.html', insHtml, 'utf8');
  console.log('Updated inspector-portal.html session script');
}
