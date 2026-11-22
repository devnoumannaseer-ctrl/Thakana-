const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public', 'user-dashboard.html');
let content = fs.readFileSync(file, 'utf8');

// Replace token retrieval in loadUserBookings
content = content.replace(
  "const token = currentUser?.token;\n        if (token) headers['Authorization'] = 'Bearer ' + token;",
  "const token = localStorage.getItem('thakana_jwt_token') || currentUser?.token;\n        if (token) headers['Authorization'] = 'Bearer ' + token;"
);

// Replace token retrieval in cancelBooking
content = content.replace(
  "if (currentUser?.token) headers['Authorization'] = 'Bearer ' + currentUser.token;",
  "const token = localStorage.getItem('thakana_jwt_token') || currentUser?.token;\n        if (token) headers['Authorization'] = 'Bearer ' + token;"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated user-dashboard.html token headers');
