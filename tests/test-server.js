require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3003;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
