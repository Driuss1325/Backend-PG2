import { Sequelize } from 'sequelize';

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_DB,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_SSL,
  MYSQL_CA_BASE64
} = process.env;

let dialectOptions = {};
if ((MYSQL_SSL || '').toUpperCase() === 'REQUIRED') {
  const caStr = MYSQL_CA_BASE64 ? Buffer.from(MYSQL_CA_BASE64, 'base64').toString('utf8') : undefined;
  dialectOptions = {
    ssl: {
      ca: caStr ? [caStr] : undefined,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  };
}

export const sequelize = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT || 3306),
  dialect: 'mysql',
  dialectOptions,
  logging: false,
  // Opcional: timeouts más generosos
  pool: { acquire: 20000 }
});

export async function connectDB() {
  console.log(`[DB] Connecting to ${MYSQL_HOST}:${MYSQL_PORT} db=${MYSQL_DB} ssl=${(MYSQL_SSL||'').toUpperCase()}`);
  await sequelize.authenticate();
}
