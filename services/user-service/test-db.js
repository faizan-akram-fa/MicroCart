const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgres://postgres:123@localhost:5432/user_db' }); 
client.connect()
  .then(() => client.query(`SELECT id, email, "sellerStatus" FROM users WHERE email='arslan@gmail.com'`))
  .then(res => { console.log('Arslan info:', res.rows); return client.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 1'); })
  .then(res => { console.log(res.rows); client.end() })
  .catch(err => console.error(err));
