require('dotenv').config();

async function testSession() {
  try {
    console.log('Testing session configuration...');
    
    // Test database connection first
    const { pgPool } = require('../api/config/database');
    console.log('Testing PostgreSQL connection...');
    
    const client = await pgPool.connect();
    console.log('PostgreSQL connection successful!');
    
    // Test if session table exists
    const result = await client.query("SELECT to_regclass('session') as table_exists");
    console.log('Session table check:', result.rows[0]);
    
    client.release();
    
    // Now test session store
    console.log('Testing session store...');
    const { sessionStore } = require('../api/config/session');
    console.log('Session store created successfully!');
    
    return true;
  } catch (error) {
    console.error('Session test failed:', error);
    return false;
  }
}

testSession().then(success => {
  console.log('Session test completed:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
});
