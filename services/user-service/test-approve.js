const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'a801ae88-6cd5-4e2e-93eb-4d32c546ee85', email: 'admin@microcart.com', role: 'admin' },
  'your-secret-key-change-in-production',
  { expiresIn: '24h' }
);
fetch('http://localhost:4000/api/admin/sellers/da323925-c711-4a81-9d1b-f4cf9b924f66/approve', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.text().then(text => ({ status: res.status, body: text })))
.then(console.log)
.catch(console.error);
