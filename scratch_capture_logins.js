const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\Nauman\\.gemini\\antigravity\\brain\\23893b2f-1069-4019-b166-289103c73a63';
const tempDir = 'C:\\Users\\Nauman\\AppData\\Local\\Temp\\edge_scr';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const targets = [
  { url: 'http://localhost:5000/login.html?role=student', out: 'thakana_login_student.png', size: '480,820' },
  { url: 'http://localhost:5000/login.html?role=owner', out: 'thakana_login_owner.png', size: '480,820' },
  { url: 'http://localhost:5000/login.html?role=admin', out: 'thakana_login_admin.png', size: '480,820' },
  { url: 'http://localhost:5000/index.html', out: 'thakana_home_desktop.png', size: '1280,850' }
];

targets.forEach(t => {
  const tempOut = path.join(tempDir, t.out);
  const finalOut = path.join(artifactDir, t.out);
  console.log('Capturing:', t.out);
  try {
    const cmd = `"${browser}" --headless --disable-gpu --user-data-dir="${tempDir}\\profile_login" --window-size=${t.size} --screenshot="${tempOut}" ${t.url}`;
    execSync(cmd, { stdio: 'inherit', timeout: 20000 });
    if (fs.existsSync(tempOut)) {
      fs.copyFileSync(tempOut, finalOut);
      console.log('Saved to artifact:', t.out, fs.statSync(finalOut).size, 'bytes');
    }
  } catch (e) {
    console.error('Error capturing', t.out, e.message);
  }
});
console.log('Done capturing login screenshots!');
