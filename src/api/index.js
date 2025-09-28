// api/index.js
// Fuerza a incluir mysql2 en el bundle:
try { require('mysql2'); } catch (e) { console.error('mysql2 missing', e); }

const serverless = require('serverless-http');
const app = require('../src/app');
module.exports = serverless(app);
