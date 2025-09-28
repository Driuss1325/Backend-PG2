const mysql = require('mysql2/promise');

module.exports = async (_req, res) => {
  try {
    const opts = {
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    };
    if ((process.env.MYSQL_SSL || '').toLowerCase() !== 'disable') {
      const caB64 = process.env.MYSQL_CA_BASE64;
      opts.ssl = caB64
        ? { rejectUnauthorized: true, ca: Buffer.from(caB64, 'base64').toString('utf8') }
        : { rejectUnauthorized: true };
    }
    const conn = await mysql.createConnection(opts);
    await conn.ping();
    const [rows] = await conn.query('select 1 as ok');
    await conn.end();
    res.status(200).json({ ok: true, rows });
  } catch (e) {
    console.error('DBTEST ERR', e);
    res.status(500).json({ ok: false, err: String(e.message || e) });
  }
};
