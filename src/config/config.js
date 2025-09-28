// src/config/config.js
require('dotenv').config();

function buildConfig() {
  const cfg = {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    define: { underscored: true },
    dialectOptions: {}
  };

  const sslMode = String(process.env.MYSQL_SSL || '').toLowerCase();
  if (sslMode === 'required' || sslMode === 'true' || sslMode === '1') {
    const b64 = process.env.MYSQL_CA_BASE64;
    cfg.dialectOptions.ssl = b64
      ? { rejectUnauthorized: true, ca: Buffer.from(b64, 'base64').toString('utf8') }
      : { rejectUnauthorized: true };
  }

  return cfg;
}

const base = buildConfig();
module.exports = { development: base, test: base, production: base };
