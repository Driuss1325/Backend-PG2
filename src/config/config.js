require('dotenv').config();
const fs = require('fs');

function buildConfig() {
  const cfg = {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    dialect: 'mysql',
    dialectOptions: {},
    define: { underscored: true }
  };

  const sslMode = (process.env.MYSQL_SSL || '').toLowerCase();
  if (sslMode === 'required' || sslMode === 'true' || sslMode === '1') {
    const caPath = process.env.MYSQL_CA_PATH;
    cfg.dialectOptions.ssl = {
      // Aiven requiere TLS; con CA validamos el servidor.
      rejectUnauthorized: true,
    };
    if (caPath) {
      cfg.dialectOptions.ssl.ca = fs.readFileSync(caPath, 'utf8');
    }
  }

  return cfg;
}

const base = buildConfig();

module.exports = {
  development: base,
  production: base
};
