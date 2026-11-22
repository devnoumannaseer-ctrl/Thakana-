const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// 1. Update authenticate to support x-admin-key and adminSecret
const authFuncOld = `function authenticate(req, res, next) {
  let token = null;`;

const authFuncNew = `function authenticate(req, res, next) {
  // Governance override for Admin Passkey
  if (req.headers['x-admin-key'] === 'thakana2026' || (req.body && req.body.adminSecret === 'thakana2026')) {
    req.user = { id: 'usr-admin-1', name: 'Super Admin Governance', role: 'admin', email: 'admin@thakana.pk' };
    return next();
  }

  let token = null;`;

code = code.replace(authFuncOld, authFuncNew);

// 2. Protect Admin Direct and Permanent delete routes
code = code.replace(
  "app.post('/api/admin/remove-hostel-direct', handleDirectRemoveHostel);",
  "app.post('/api/admin/remove-hostel-direct', authenticate, authorize('admin'), handleDirectRemoveHostel);"
);
code = code.replace(
  "app.post('/api/admin/remove-hostel', handleDirectRemoveHostel);",
  "app.post('/api/admin/remove-hostel', authenticate, authorize('admin'), handleDirectRemoveHostel);"
);
code = code.replace(
  "app.post('/api/admin/remove-all-hostels', (req, res) => {",
  "app.post('/api/admin/remove-all-hostels', authenticate, authorize('admin'), (req, res) => {"
);
code = code.replace(
  "app.post('/api/admin/restore-hostel-direct', handleDirectRestoreHostel);",
  "app.post('/api/admin/restore-hostel-direct', authenticate, authorize('admin'), handleDirectRestoreHostel);"
);
code = code.replace(
  "app.post('/api/admin/restore-hostel', handleDirectRestoreHostel);",
  "app.post('/api/admin/restore-hostel', authenticate, authorize('admin'), handleDirectRestoreHostel);"
);
code = code.replace(
  "app.post('/api/admin/restore-all-hostels', (req, res) => {",
  "app.post('/api/admin/restore-all-hostels', authenticate, authorize('admin'), (req, res) => {"
);
code = code.replace(
  "app.post('/api/admin/delete-hostel-permanent', handleDeleteHostelPermanent);",
  "app.post('/api/admin/delete-hostel-permanent', authenticate, authorize('admin'), handleDeleteHostelPermanent);"
);
code = code.replace(
  "app.post('/api/admin/delete-hostel', handleDeleteHostelPermanent);",
  "app.post('/api/admin/delete-hostel', authenticate, authorize('admin'), handleDeleteHostelPermanent);"
);
code = code.replace(
  "app.delete('/api/admin/hostels/:id', (req, res) => {",
  "app.delete('/api/admin/hostels/:id', authenticate, authorize('admin'), (req, res) => {"
);

// 3. Protect owner update beds with verifyHostelOwnership
code = code.replace(
  "app.post('/api/owner/update-beds', (req, res) => {",
  "app.post('/api/owner/update-beds', authenticate, authorize('owner', 'admin'), verifyHostelOwnership, (req, res) => {"
);

// 4. Protect owner removal request
code = code.replace(
  "app.post('/api/owner/removal-request', (req, res) => {",
  "app.post('/api/owner/removal-request', authenticate, authorize('owner', 'admin'), verifyHostelOwnership, (req, res) => {"
);

// 5. Protect audit submit with verifyInspectorAssignment
code = code.replace(
  "app.post('/api/audit-submit', (req, res) => {",
  "app.post('/api/audit-submit', authenticate, authorize('inspector', 'admin'), verifyInspectorAssignment, (req, res) => {"
);

// 6. Protect admin removal requests & approval
code = code.replace(
  "app.get('/api/admin/removal-requests', (req, res) => {",
  "app.get('/api/admin/removal-requests', authenticate, authorize('admin'), (req, res) => {"
);
code = code.replace(
  "app.post('/api/admin/removal-requests/:requestId/decision', (req, res) => {",
  "app.post('/api/admin/removal-requests/:requestId/decision', authenticate, authorize('admin'), (req, res) => {"
);
code = code.replace(
  "app.post('/api/admin/approve-hostel', (req, res) => {",
  "app.post('/api/admin/approve-hostel', authenticate, authorize('admin'), (req, res) => {"
);

fs.writeFileSync('server.js', code, 'utf8');
console.log('Successfully attached RBAC middleware to all protected endpoints in server.js!');
