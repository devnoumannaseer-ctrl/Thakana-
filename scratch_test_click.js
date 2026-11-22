const { execSync } = require('child_process');
const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempDir = 'C:\\Users\\Nauman\\AppData\\Local\\Temp\\edge_scr';

// Test loading the page and calling setUniFilter directly to confirm DOM changes
const script = `
  const html = document.documentElement.outerHTML;
  console.log('Page loaded successfully');
`;

try {
  // We can use msedge --dump-dom with a specific university query or test with node
  console.log('Testing node server API directly...');
  const http = require('http');
  ['all', 'UMT', 'FAST', 'NUST', 'LUMS', 'UCP', 'COMSATS', 'PU', 'NED'].forEach(u => {
    http.get('http://localhost:5000/api/hostels?uni=' + u, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        console.log(`Uni: ${u.padEnd(8)} -> Count: ${json.count} hostels (Success: ${json.success})`);
      });
    });
  });
} catch (e) {
  console.error(e);
}
