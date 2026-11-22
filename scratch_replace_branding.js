const fs = require('fs');

const files = [
  'public/index.html',
  'public/owner-portal.html',
  'public/admin-portal.html',
  'public/roommate-match.html'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace text brandings
  content = content.replace(/Staezy/g, 'Thakana');
  content = content.replace(/STAEZY/g, 'THAKANA');
  content = content.replace(/staezy\./g, 'thakana.');
  content = content.replace(/staezy\s*\./g, 'thakana.');
  
  // Replace in brand logo HTML
  content = content.replace(/staezy<span class="w-2 h-2/g, 'thakana<span class="w-2 h-2');
  content = content.replace(/staezy<span class="text-\[#826bbd\]"/g, 'thakana<span class="text-[#826bbd]"');
  content = content.replace(/staezy<span/g, 'thakana<span');

  // Replace in copyright / urls
  content = content.replace(/Staezy Pakistan/g, 'Thakana Pakistan');
  content = content.replace(/staezy_admin_mode/g, 'thakana_admin_mode');
  content = content.replace(/staezy_removed_hostel_ids/g, 'thakana_removed_hostel_ids');
  content = content.replace(/staezy_removed_all/g, 'thakana_removed_all');
  content = content.replace(/staezy_pwa_installed/g, 'thakana_pwa_installed');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated branding in:', file);
});
