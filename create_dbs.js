const path = require('path');
const fs = require('fs');

// Try to find 'pg' in the user-service node_modules
const pgPath = path.join(__dirname, 'services', 'user-service', 'node_modules', 'pg');
let pg;

if (fs.existsSync(pgPath)) {
  pg = require(pgPath);
} else {
  try {
    pg = require('pg');
  } catch (e) {
    console.error('❌ Error: The "pg" module was not found. Please ensure "npm install" has been run in "services/user-service".');
    process.exit(1);
  }
}

const { Client } = pg;

async function createDatabases() {
  const password = process.env.PG_PASSWORD || 'postgres';
  
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: password,
    port: 5432,
    database: 'postgres', 
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server.');

    const dbsToCreate = ['user_db', 'product_db', 'cart_db', 'order_db', 'wishlist_db', 'support_db'];

    for (const dbName of dbsToCreate) {
      try {
        const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [dbName]);
        if (res.rowCount === 0) {
          console.log(`🚀 Creating database: ${dbName}...`);
          await client.query(`CREATE DATABASE "${dbName}"`);
          console.log(`✅ ${dbName} created successfully.`);
        } else {
          console.log(`ℹ️  ${dbName} already exists.`);
        }
      } catch (err) {
         console.error(`❌ Error creating ${dbName}:`, err.message);
      }
    }
  } catch (err) {
    if (err.message.includes('authentication failed')) {
        console.error('❌ Error: Password authentication failed. Please check your PostgreSQL password.');
    } else {
        console.error('❌ Failed to connect to PostgreSQL:', err.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabases();

