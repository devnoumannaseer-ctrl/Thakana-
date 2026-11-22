const fs = require('fs');

let loginHtml = fs.readFileSync('public/login.html', 'utf8');

// Update login submission redirect logic
const oldLoginSuccess = `          // Persist user session
          localStorage.setItem('thakana_auth_user', JSON.stringify(data.user));
          
          if (currentRole === 'student') {
            localStorage.setItem('thakana_user', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
          } else if (currentRole === 'owner') {
            localStorage.setItem('thakana_owner', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'owner-portal.html'; }, 800);
          } else if (currentRole === 'inspector') {
            localStorage.setItem('thakana_inspector', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'inspector-portal.html'; }, 800);
          } else if (currentRole === 'admin') {
            localStorage.setItem('thakana_admin', JSON.stringify(data.user));
            localStorage.setItem('thakana_admin_mode', 'true');
            setTimeout(() => { window.location.href = 'admin-portal.html'; }, 800);
          }`;

const newLoginSuccess = `          // Persist user session & JWT token
          if (data.token) {
            data.user.token = data.token;
            localStorage.setItem('thakana_jwt_token', data.token);
          }
          localStorage.setItem('thakana_auth_user', JSON.stringify(data.user));
          
          if (currentRole === 'student') {
            localStorage.setItem('thakana_user', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 800);
          } else if (currentRole === 'owner') {
            localStorage.setItem('thakana_owner', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'owner-portal.html'; }, 800);
          } else if (currentRole === 'inspector') {
            localStorage.setItem('thakana_inspector', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'inspector-portal.html'; }, 800);
          } else if (currentRole === 'admin') {
            localStorage.setItem('thakana_admin', JSON.stringify(data.user));
            localStorage.setItem('thakana_admin_mode', 'true');
            setTimeout(() => { window.location.href = 'admin-portal.html'; }, 800);
          }`;

loginHtml = loginHtml.replace(oldLoginSuccess, newLoginSuccess);

// Also update fallback in catch block
const oldCatchRedirect = `if (currentRole === 'student') {
          localStorage.setItem('thakana_user', JSON.stringify(localUser));
          setTimeout(() => { window.location.href = 'index.html'; }, 800);`;

const newCatchRedirect = `if (currentRole === 'student') {
          localStorage.setItem('thakana_user', JSON.stringify(localUser));
          setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 800);`;

loginHtml = loginHtml.replace(oldCatchRedirect, newCatchRedirect);

fs.writeFileSync('public/login.html', loginHtml, 'utf8');
console.log('Updated public/login.html redirects');
