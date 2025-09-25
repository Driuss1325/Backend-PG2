const http = require('http');
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API FireGuard en http://0.0.0.0:${PORT}`);
});
