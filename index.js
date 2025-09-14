const express = require("express");
const i2c = require("i2c-bus");
const cors = require("cors");
const { SerialPort } = require("serialport");
const http = require("http");

const SHTC3_I2C_ADDRESS = 0x70;
const SHTC3_WakeUp = 0x3517;
const SHTC3_Software_RES = 0x805d;
const SHTC3_NM_CD_ReadTH = 0x7866;
const SHTC3_NM_CD_ReadRH = 0x58e0;

const app = express();
const port = 3001;
app.use(cors());
const server = http.createServer(app);

const i2cBus = i2c.openSync(1); 

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
const shtc3 = new SHTC3(i2cBus, SHTC3_I2C_ADDRESS);

const pms5003Port = new SerialPort({
  path: "/dev/serial0", 
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1
});

let pmsBuffer = Buffer.alloc(0);

pms5003Port.on("data", (chunk) => {
  pmsBuffer = Buffer.concat([pmsBuffer, chunk]);
  if (pmsBuffer.length > 256) {
    pmsBuffer = pmsBuffer.slice(-64);
  }
});

pms5003Port.on("error", (err) => {
  console.error("Error PMS5003:", err.message);
});

function readPMS5003() {
  const idx = pmsBuffer.indexOf(Buffer.from([0x42, 0x4d]));
  if (idx !== -1 && pmsBuffer.length >= idx + 32) {
    const frame = pmsBuffer.slice(idx, idx + 32);
    const pm2_5 = frame.readUInt16BE(10);
    const pm10 = frame.readUInt16BE(12);
    return { pm2_5, pm10 };
  }
  throw new Error("No hay frame válido del PMS5003 aún");
}

let lastData = null;

function readAllNow() {
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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sensors-api", time: new Date().toISOString() });
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

const POLL_MS = 5000;
setInterval(() => {
  try {
    readAllNow();
  } catch (e) {
  }
}, POLL_MS);

server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`GET /health  -> OK`);
  console.log(`GET /read    -> Lee ambos sensores ahora`);
  console.log(`GET /latest  -> Último dato cacheado`);
});
