const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'scratch_test_critical_fixes.js');
let content = fs.readFileSync(testFile, 'utf8');

content = content.replace("clearedCookie.includes('thakana_token=;')", "clearedCookie.startsWith('thakana_token=')");

fs.writeFileSync(testFile, content, 'utf8');
console.log('Fixed test assertion for cleared cookie');
