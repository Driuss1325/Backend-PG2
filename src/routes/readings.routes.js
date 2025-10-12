import { Router } from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { ingestReading } from '../controllers/readings.controller.js';

const r = Router();

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
 *               temperature:
 *                 type: number
 *               humidity:
 *                 type: number
 *               pm25:
 *                 type: number
 *               pm10:
 *                 type: number
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               accuracy:
 *                 type: number
 *     responses:
 *       201:
 *         description: Creado
 */
r.post('/', requireApiKey, ingestReading);

export default r;
