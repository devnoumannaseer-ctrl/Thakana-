const fs = require('fs');
const html = fs.readFileSync('staezy_dump.html', 'utf8');

// Search for any CSS rules, colors, root variables
const rootVars = html.match(/--[a-zA-Z0-9_-]+:\s*[^;]+;/g) || [];
console.log('Root CSS vars:', rootVars.slice(0, 30));

// Check header and desktop nav
const headerIdx = html.indexOf('<header');
if (headerIdx !== -1) {
  console.log('\n--- HEADER DESKTOP ---');
  console.log(html.slice(headerIdx, headerIdx + 1500));
}
