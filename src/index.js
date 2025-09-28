require('dotenv').config();
const http = require('http');
const app = require('./app');
const PORT = process.env.PORT || 3001;
http.createServer(app).listen(PORT, '0.0.0.0', () =>
  console.log(`API local en http://0.0.0.0:${PORT}`)
);
