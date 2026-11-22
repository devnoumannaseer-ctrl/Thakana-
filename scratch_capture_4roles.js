const { execSync } = require('child_process');
const fs = require('fs');
const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const tempOut = 'C:\\Users\\Nauman\\AppData\\Local\\Temp\\edge_scr\\thakana_login_4roles.png';
const finalOut = 'C:\\Users\\Nauman\\.gemini\\antigravity\\brain\\23893b2f-1069-4019-b166-289103c73a63\\thakana_login_4roles.png';

try {
  execSync(`"${browser}" --headless --disable-gpu --user-data-dir="C:\\Users\\Nauman\\AppData\\Local\\Temp\\edge_scr\\p4" --window-size=480,850 --screenshot="${tempOut}" http://localhost:5000/login.html?role=inspector`, { timeout: 15000 });
  if (fs.existsSync(tempOut)) {
    fs.copyFileSync(tempOut, finalOut);
    console.log('Saved to artifact:', fs.statSync(finalOut).size, 'bytes');
  }
} catch (e) {
  console.error(e.message);
}
