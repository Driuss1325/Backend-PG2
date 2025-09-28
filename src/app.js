require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi'); // si ya lo tienes

// Rutas
const authRoutes = require('./routes/auth.routes');
const devicesRoutes = require('./routes/devices.routes');
const readingsRoutes = require('./routes/readings.routes');
const reportsRoutes = require('./routes/reports.routes');
const enrollRoutes = require('./routes/enroll.routes');
const errorMiddleware = require('./middlewares/error');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));
app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

// Health
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'fireguard-api', now: new Date().toISOString() })
);

// APIs
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/readings', readingsRoutes); // ← recibe lecturas desde tus Raspberry
app.use('/api/reports', reportsRoutes);
app.use('/api/enroll', enrollRoutes);

// Errores
app.use(errorMiddleware);

module.exports = app;
