const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pgPool } = require('./database');

// Create PostgreSQL Session Store
const sessionStore = new pgSession({
  pool: pgPool,                // Connection pool
  tableName: 'session',        // Use the table created earlier
  createTableIfMissing: false  // We created it manually
});

// Session configuration
const sessionConfig = session({
  store: sessionStore, // Use the PostgreSQL store
  secret: process.env.SESSION_SECRET || 'fallback-secret-replace-me!', // !! USE AN ENV VAR FOR SECRET !!
  resave: false, // Recommended: Don't save session if unmodified
  saveUninitialized: false, // Recommended: Don't create session until something stored
  name: 'connect.sid', // Explicitly set the default session cookie name
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Ensure cookies are sent only over HTTPS in production
    httpOnly: true, // Prevent client-side JS from accessing the cookie
    sameSite: 'lax', // Recommended for most cases to prevent CSRF
    path: '/', // Ensure cookie is valid for all paths
    maxAge: 24 * 60 * 60 * 1000 // 1 day
    // Consider setting domain explicitly if needed
    // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  },
  proxy: true // Trust the reverse proxy when setting secure cookies (Vercel/Heroku)
});

module.exports = {
  sessionStore,
  sessionConfig
};
