// Quick test to verify order route is accessible
const express = require('express');
const app = express();

// Test route without auth
app.post('/test-order', (req, res) => {
  console.log('✅ Test order route hit successfully');
  res.json({ message: 'Order route is working' });
});

app.listen(3333, () => {
  console.log('Test server running on port 3333');
  console.log('Try: POST http://localhost:3333/test-order');
});