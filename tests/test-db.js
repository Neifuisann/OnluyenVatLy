require('dotenv').config();
const { supabase } = require('../api/config/database');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Simple test query
    const { data, error } = await supabase
      .from('lessons')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      return false;
    }
    
    console.log('Database connection successful!');
    console.log('Sample data:', data);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

testDatabase().then(success => {
  console.log('Test completed:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
});
