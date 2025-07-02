const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miojaflixmncmhsgyabd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb2phZmxpeG1uY21oc2d5YWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NTU0NTUsImV4cCI6MjA1OTIzMTQ1NX0.e3nU5sBvHsFHZP48jg1vjYsP-N2S4AgYuQgt8opHE_g';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
if (!supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_SERVICE_KEY environment variable not set. Storage uploads might fail if RLS requires authenticated users or service role.');
}

// Database connection string validation
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// PostgreSQL connection pool configuration
const pgPool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Adjust as per Supabase requirements or use proper CA certs
  }
});

// PostgreSQL pool error handling
pgPool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1); // Consider a more graceful shutdown strategy
});

module.exports = {
  supabase,
  supabaseAdmin,
  pgPool,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey
};
