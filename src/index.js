// src/index.js
require('dotenv').config();
const http = require('http');
const app = require('./app');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT, 10) || 3001;

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`API escuchando en http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('HTTP server error:', err);
  process.exit(1);
});

// cierre limpio (opcional)
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
