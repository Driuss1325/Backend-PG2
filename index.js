const express = require('express');
const i2c = require('i2c-bus');
const cors = require('cors');
const SerialPort = require('serialport'); // Usamos 'serialport' en lugar de 'pms5003-sensor'
const Readline = require('@serialport/parser-readline');

const SHTC3_I2C_ADDRESS = 0x70;
const SHTC3_WakeUp = 0x3517;
const SHTC3_Sleep = 0xB098;
const SHTC3_Software_RES = 0x805D;
const SHTC3_NM_CD_ReadTH = 0x7866;
const SHTC3_NM_CD_ReadRH = 0x58E0;

const app = express();
const port = 3000;

app.use(cors());

const i2cBus = i2c.openSync(1); // Cambia 1 por el bus correcto si es necesario

class SHTC3 {
    constructor(bus, address) {
        this.bus = bus;
        this.address = address;
        this.reset();
    }

    writeCommand(cmd) {
        const buffer = Buffer.from([(cmd >> 8) & 0xFF, cmd & 0xFF]);
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
            const temperature = ((buf[0] << 8 | buf[1]) * 175) / 65536 - 45.0;
            console.log(`Temperatura leída: ${temperature.toFixed(2)}°C`);
            return temperature;
        }
        console.log('Error al leer la temperatura');
        return 0; 
    }

    readHumidity() {
        this.wakeUp();
        this.writeCommand(SHTC3_NM_CD_ReadRH);
        this.sleep(20);
        const buf = Buffer.alloc(3);
        this.bus.i2cReadSync(this.address, 3, buf);
        if (this.checkCrc(buf, 2, buf[2])) {
            const humidity = (100 * (buf[0] << 8 | buf[1])) / 65536;
            console.log(`Humedad leída: ${humidity.toFixed(2)}%`);
            return humidity;
        }
        console.log('Error al leer la humedad');
        return 0; 
    }

    checkCrc(data, len, checksum) {
        let crc = 0xFF;
        for (let i = 0; i < len; i++) {
            crc ^= data[i];
            for (let bit = 0; bit < 8; bit++) {
                if (crc & 0x80) {
                    crc = (crc << 1) ^ 0x0131;
                } else {
                    crc <<= 1;
                }
            }
        }
        return crc === checksum;
    }
}

// Inicializa el puerto serial para PMS5003
const portPMS5003 = new SerialPort('/dev/serial0', {
  baudRate: 9600,
});

const parser = portPMS5003.pipe(new Readline({ delimiter: '\n' }));

let pm25 = 0;
let pm10 = 0;

// Lee datos del PMS5003
parser.on('data', (data) => {
    const buffer = Buffer.from(data, 'hex');

    if (buffer.length >= 32 && buffer[0] === 0x42 && buffer[1] === 0x4D) {
        pm25 = buffer.readUInt16BE(12); // PM2.5 en µg/m³
        pm10 = buffer.readUInt16BE(14); // PM10 en µg/m³
        console.log(`Lectura del PMS5003 -> PM2.5: ${pm25} µg/m³, PM10: ${pm10} µg/m³`);
    } else {
        console.log('Datos recibidos no válidos del PMS5003:', data);
    }
});

portPMS5003.on('open', () => {
    console.log('Puerto serial abierto para PMS5003');
});

portPMS5003.on('error', (err) => {
    console.log('Error en el puerto serial del PMS5003:', err.message);
});

const shtc3 = new SHTC3(i2cBus, SHTC3_I2C_ADDRESS);

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let intervalTime = 10000; // Intervalo inicial en milisegundos
    let intervalId;

    const sendData = () => {
        const temperature = shtc3.readTemperature();
        const humidity = shtc3.readHumidity();

        const responseData = {
            temperature: temperature.toFixed(2),
            humidity: humidity.toFixed(2),
            pm25: pm25.toFixed(2),
            pm10: pm10.toFixed(2),
            timestamp: new Date().toISOString()
        };

        res.write(`data: ${JSON.stringify(responseData)}\n\n`);
        console.log('Enviando datos del sensor:', responseData);

        // Ajustar el tiempo de intervalo basado en la temperatura
        if (temperature >= 50) {
            if (intervalTime !== 3000) { // Cambia solo si el intervalo actual es diferente
                clearInterval(intervalId);
                intervalTime = 3000;
                intervalId = setInterval(sendData, intervalTime);
                console.log('Intervalo ajustado a 3000 ms');
            }
        } else {
            if (intervalTime !== 10000) { // Cambia solo si el intervalo actual es diferente
                clearInterval(intervalId);
                intervalTime = 10000;
                intervalId = setInterval(sendData, intervalTime);
                console.log('Intervalo ajustado a 10000 ms');
            }
        }
    };

    intervalId = setInterval(sendData, intervalTime);

    req.on('close', () => {
        clearInterval(intervalId);
        console.log('Conexión cerrada, deteniendo la transmisión.');
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
