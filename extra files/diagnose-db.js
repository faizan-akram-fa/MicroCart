const fs = require('fs');
const path = require('path');

// Try to find pg module
let pg;
try {
  pg = require('./services/user-service/node_modules/pg');
} catch (e) {
  try {
    pg = require('pg');
  } catch (e2) {
    console.error('❌ Could not find "pg" module. Please run checking from a directory with dependencies or install pg.');
    process.exit(1);
  }
}

const { Client } = pg;

const DB_CONFIG = {
  user: 'postgres',
  password: '123', // Assuming checking with this password first
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Connect to default db to create others
};

const REQUIRED_DATABASES = [
  'user_db',
  'product_db',
  'cart_db',
  'order_db',
  'wishlist_db'
];

async function checkAndCreateDatabases() {
  console.log(`🔌 Connecting to PostgreSQL at ${DB_CONFIG.host}:${DB_CONFIG.port} as ${DB_CONFIG.user}...`);
  
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL.');
    
    // Get existing databases
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    const existingDbs = res.rows.map(row => row.datname);
    
    console.log('📊 Existing databases:', existingDbs.join(', '));
    
    for (const dbName of REQUIRED_DATABASES) {
      if (existingDbs.includes(dbName)) {
        console.log(`  ✓ Database "${dbName}" already exists.`);
      } else {
        console.log(`  ⚠️ Database "${dbName}" is MISSING. Creating...`);
        try {
          await client.query(`CREATE DATABASE "${dbName}";`);
          console.log(`  ✅ Created database "${dbName}".`);
        } catch (err) {
          console.error(`  ❌ Failed to create database "${dbName}":`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.message.includes('password')) {
      console.log('💡 TIP: The password "123" might be incorrect. Please check your PostgreSQL password.');
    }
  } finally {
    await client.end();
  }
}

checkAndCreateDatabases();
