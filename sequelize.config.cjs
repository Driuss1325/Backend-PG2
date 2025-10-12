require("dotenv").config(); // <-- AÑADE ESTO

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_DB,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_SSL,
  MYSQL_CA_BASE64,
} = process.env;

let dialectOptions = {};
if ((MYSQL_SSL || "").toUpperCase() === "REQUIRED") {
  const ca = MYSQL_CA_BASE64
    ? Buffer.from(MYSQL_CA_BASE64, "base64").toString("utf8")
    : undefined;
  dialectOptions = {
    ssl: {
      ca: ca ? [ca] : undefined,
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
  };
}

module.exports = {
  development: {
    username: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT || 3306),
    dialect: "mysql",
    dialectOptions,
    logging: false,
  },
  production: {
    username: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT || 3306),
    dialect: "mysql",
    dialectOptions,
    logging: false,
  },
};
