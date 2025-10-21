import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { ingestReading, getReadings } from '../controllers/readings.controller.js';

const r = Router();

/**
 * @openapi
 * /api/readings:
 *   get:
 *     summary: Listar lecturas con filtros
 *     tags: [Readings]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: integer
 *         description: Filtra por ID de dispositivo.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 5000
 *         description: Número máximo de registros a devolver.
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO 8601. Incluir lecturas desde esta fecha/hora (>=).
 *       - in: query
 *         name: until
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO 8601. Incluir lecturas hasta esta fecha/hora (<=).
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden por createdAt.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:          { type: integer }
 *                   deviceId:    { type: integer }
 *                   temperature: { type: number, nullable: true }
 *                   humidity:    { type: number, nullable: true }
 *                   pm25:        { type: number, nullable: true }
 *                   pm10:        { type: number, nullable: true }
 *                   createdAt:   { type: string, format: date-time }
 *                   updatedAt:   { type: string, format: date-time }
 */
r.get('/', getReadings);

/**
 * @openapi
 * /api/readings:
 *   post:
 *     summary: Ingesta de lecturas desde dispositivo (x-api-key)
 *     tags: [Readings]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-device-id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               temperature: { type: number }
 *               humidity:    { type: number }
 *               pm25:        { type: number }
 *               pm10:        { type: number }
 *               lat:         { type: number }
 *               lng:         { type: number }
 *               accuracy:    { type: number }
 *     responses:
 *       201:
 *         description: Creado
 */
r.post('/', requireApiKey, ingestReading);

export default r;
