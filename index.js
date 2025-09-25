// server.js
// API de sensores para Raspberry Pi (SHTC3 por I2C + PMS5003 por Serial)
// Escucha en 0.0.0.0 y no se cae si un sensor falla al iniciar.

const express = require("express");
const i2c = require("i2c-bus");
const cors = require("cors");
const { SerialPort } = require("serialport");
const http = require("http");
const os = require("os");

// ---------- Constantes SHTC3 ----------
const SHTC3_I2C_ADDRESS = 0x70;
const SHTC3_WakeUp = 0x3517;
const SHTC3_Software_RES = 0x805d;
const SHTC3_NM_CD_ReadTH = 0x7866;
const SHTC3_NM_CD_ReadRH = 0x58e0;

// ---------- App/HTTP ----------
const app = express();
const port = 3001;
app.use(cors());
const server = http.createServer(app);

// ---------- Estado global ----------
let i2cBus = null;
let shtc3 = null;
let pms5003Port = null;
let pmsBuffer = Buffer.alloc(0);
let lastData = null;

// ---------- Utilidades ----------
function listIPv4() {
  const nets = Object.values(os.networkInterfaces()).flat();
  return nets.filter(n => !n.internal && (n.family === "IPv4" || n.family === 4)).map(n => n.address);
}

// ---------- Clase SHTC3 ----------
class SHTC3 {
  constructor(bus, address) {
    this.bus = bus;
    this.address = address;
    this.reset();
  }
  writeCommand(cmd) {
    const buffer = Buffer.from([(cmd >> 8) & 0xff, cmd & 0xff]);
    this.bus.i2cWriteSync(this.address, buffer.length, buffer);
  }
  reset() {
    this.writeCommand(SHTC3_Software_RES);
    this.sleep(10);
  }
  wakeUp() {
    this.writeCommand(SHTC3_WakeUp);
    this.sleep(10);
  }
  sleep(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {}
  }
  readTemperature() {
    this.wakeUp();
    this.writeCommand(SHTC3_NM_CD_ReadTH);
    this.sleep(20);
    const buf = Buffer.alloc(3);
    this.bus.i2cReadSync(this.address, 3, buf);
    if (this.checkCrc(buf, 2, buf[2])) {
      return (((buf[0] << 8) | buf[1]) * 175) / 65536 - 45.0;
    }
    throw new Error("CRC inválido en temperatura");
  }
  readHumidity() {
    this.wakeUp();
    this.writeCommand(SHTC3_NM_CD_ReadRH);
    this.sleep(20);
    const buf = Buffer.alloc(3);
    this.bus.i2cReadSync(this.address, 3, buf);
    if (this.checkCrc(buf, 2, buf[2])) {
      return (100 * ((buf[0] << 8) | buf[1])) / 65536;
    }
    throw new Error("CRC inválido en humedad");
  }
  checkCrc(data, len, checksum) {
    let crc = 0xff;
    for (let i = 0; i < len; i++) {
      crc ^= data[i];
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc & 0x80) ? ((crc << 1) ^ 0x131) : (crc << 1);
        crc &= 0xff;
      }
    }
    return crc === checksum;
  }
}

// ---------- Lectura PMS5003 ----------
function attachPMSListeners() {
  if (!pms5003Port) return;
  pms5003Port.on("data", (chunk) => {
    pmsBuffer = Buffer.concat([pmsBuffer, chunk]);
    if (pmsBuffer.length > 256) {
      pmsBuffer = pmsBuffer.slice(-64);
    }
  });
  pms5003Port.on("error", (err) => {
    console.error("Error PMS5003:", err.message);
  });
}

function readPMS5003() {
  const idx = pmsBuffer.indexOf(Buffer.from([0x42, 0x4d])); // Header 'BM'
  if (idx !== -1 && pmsBuffer.length >= idx + 32) {
    const frame = pmsBuffer.slice(idx, idx + 32);
    const pm2_5 = frame.readUInt16BE(10);
    const pm10 = frame.readUInt16BE(12);
    return { pm2_5, pm10 };
  }
  throw new Error("No hay frame válido del PMS5003 aún");
}

// ---------- Lógica de lectura combinada ----------
function readAllNow() {
  if (!shtc3) throw new Error("I2C/SHTC3 no inicializado");
  if (!pms5003Port) throw new Error("Serial PMS5003 no inicializado");

  const temperature = shtc3.readTemperature();
  const humidity = shtc3.readHumidity();
  const { pm2_5, pm10 } = readPMS5003();

  const data = {
    temperature: Number(temperature.toFixed(2)),
    humidity: Number(humidity.toFixed(2)),
    pm2_5: Number(pm2_5.toFixed(2)),
    pm10: Number(pm10.toFixed(2)),
    timestamp: new Date().toISOString()
  };
  lastData = data;
  return data;
}

// ---------- Rutas ----------
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "sensors-api",
    time: new Date().toISOString(),
    i2cReady: Boolean(shtc3),
    serialReady: Boolean(pms5003Port),
    lastSample: lastData?.timestamp || null
  });
});

app.get("/latest", (_req, res) => {
  if (!lastData) {
    return res.status(503).json({ error: "Sin datos aún. Usa /read para forzar una lectura." });
  }
  res.json(lastData);
});

app.get("/read", (_req, res) => {
  try {
    const data = readAllNow();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ---------- Arranque del server primero ----------
server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor HTTP arriba en puerto ${port}`);
  const ips = listIPv4();
  if (ips.length) {
    for (const ip of ips) {
      console.log(`→ Probar: http://${ip}:${port}/health`);
      console.log(`→ Probar: http://${ip}:${port}/read`);
      console.log(`→ Probar: http://${ip}:${port}/latest`);
    }
  } else {
    console.log(`→ También: http://localhost:${port}/health`);
  }
  console.log("Inicializando hardware…");
  initHardware();
});

// ---------- Inicialización de hardware (no tumba el server) ----------
function initHardware() {
  // I2C/SHTC3
  try {
    i2cBus = i2c.openSync(1);
    shtc3 = new SHTC3(i2cBus, SHTC3_I2C_ADDRESS);
    console.log("I2C/SHTC3 OK");
  } catch (e) {
    console.error("I2C init failed:", e.message);
  }

  // Serial PMS5003
  try {
    pms5003Port = new SerialPort({
      path: "/dev/serial0",
      baudRate: 9600,
      dataBits: 8,
      parity: "none",
      stopBits: 1
    });
    attachPMSListeners();
    console.log("Serial PMS5003 OK");
  } catch (e) {
    console.error("Serial init failed:", e.message);
  }

  // Polling periódico (si hay sensores, intentará leer; si no, ignora el error)
  const POLL_MS = 5000;
  setInterval(() => {
    try {
      readAllNow();
    } catch (e) {
      // Silencioso para no llenar logs; descomenta si quieres ver los errores:
      // console.warn("Poll read error:", e.message);
    }
  }, POLL_MS);
}

// ---------- Manejo básico de errores de proceso ----------
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});
