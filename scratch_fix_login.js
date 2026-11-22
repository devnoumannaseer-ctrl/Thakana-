const fs = require('fs');
const path = require('path');

// 1. FIX LOGIN.HTML
let loginHtml = fs.readFileSync(path.join(__dirname, 'public/login.html'), 'utf8');

// Fix autoFillDemo
const badAutoFill = `} else if (currentRole === 'inspector') {
        inputIdentifier.value = 'inspector@thakana.pk';
        inputPassword.value = 'inspector123';
      } else if (currentRole === 'inspector') {
            localStorage.setItem('thakana_inspector', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'inspector-portal.html'; }, 800);
          } else if (currentRole === 'admin') {`;

const fixedAutoFill = `} else if (currentRole === 'inspector') {
        inputIdentifier.value = 'inspector@thakana.pk';
        inputPassword.value = 'inspector123';
      } else if (currentRole === 'admin') {`;

if (loginHtml.includes(badAutoFill)) {
  loginHtml = loginHtml.replace(badAutoFill, fixedAutoFill);
}

// Fix login submit redirect & token saving
const badSuccessRedirect = `if (res.ok && data.success) {
          showAlert('🎉 ' + data.message + ' Redirecting...', true);
          
          // Persist user session
          localStorage.setItem('thakana_auth_user', JSON.stringify(data.user));
          
          if (currentRole === 'student') {
            localStorage.setItem('thakana_user', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
          } else if (currentRole === 'owner') {
            localStorage.setItem('thakana_owner', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'owner-portal.html'; }, 800);
          } else if (currentRole === 'admin') {
            localStorage.setItem('thakana_admin', JSON.stringify(data.user));
            localStorage.setItem('thakana_admin_mode', 'true');
            setTimeout(() => { window.location.href = 'admin-portal.html'; }, 800);
          }
        }`;

const fixedSuccessRedirect = `if (res.ok && data.success) {
          showAlert('🎉 ' + data.message + ' Redirecting...', true);
          
          // Persist user session & JWT token
          localStorage.setItem('thakana_auth_user', JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem('thakana_jwt_token', data.token);
          }
          
          if (currentRole === 'student' || data.user.role === 'student' || data.user.role === 'user') {
            localStorage.setItem('thakana_user', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 800);
          } else if (currentRole === 'owner' || data.user.role === 'owner') {
            localStorage.setItem('thakana_owner', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'owner-portal.html'; }, 800);
          } else if (currentRole === 'inspector' || data.user.role === 'inspector') {
            localStorage.setItem('thakana_inspector', JSON.stringify(data.user));
            setTimeout(() => { window.location.href = 'inspector-portal.html'; }, 800);
          } else if (currentRole === 'admin' || data.user.role === 'admin') {
            localStorage.setItem('thakana_admin', JSON.stringify(data.user));
            localStorage.setItem('thakana_admin_mode', 'true');
            setTimeout(() => { window.location.href = 'admin-portal.html'; }, 800);
          }
        }`;

if (loginHtml.includes(badSuccessRedirect)) {
  loginHtml = loginHtml.replace(badSuccessRedirect, fixedSuccessRedirect);
}

fs.writeFileSync(path.join(__dirname, 'public/login.html'), loginHtml, 'utf8');
console.log('Fixed public/login.html');
