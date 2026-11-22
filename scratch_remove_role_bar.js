const fs = require('fs');

const files = [
  'public/index.html',
  'public/owner-portal.html',
  'public/inspector-portal.html',
  'public/admin-portal.html',
  'public/roommate-match.html',
  'public/login.html',
  'public/admin-review.html',
  'public/student-pass.html'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  
  // Match either 4-ROLE or 3-SIDED switcher bar block
  const pattern = /\s*<!-- (?:4-ROLE|3-SIDED) PLATFORM GLOBAL SWITCHER BAR -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(?:\s*<\/div>)?/g;
  
  if (pattern.test(html)) {
    html = html.replace(pattern, '');
    fs.writeFileSync(file, html, 'utf8');
    console.log('Removed role access bar from:', file);
  } else {
    console.log('Pattern not matched in:', file);
  }
});
