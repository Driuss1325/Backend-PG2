import { Router } from 'express';
import { authJwt } from '../middleware/authJwt.js';
import {
  listAlerts,
  ackAlert,
  muteAlert,
  getThresholds,
  putThresholds,
  getEffectiveThresholds,
} from '../controllers/alerts.controller.js';

const r = Router();

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: Listar alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: integer
 *         description: Filtra por ID de dispositivo.
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO 8601. Incluir desde esta fecha/hora (>=).
 *       - in: query
 *         name: until
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO 8601. Incluir hasta esta fecha/hora (<=).
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *           nullable: true
 *         description: true = solo confirmadas; false = solo no confirmadas; omitido = todas.
 *     responses:
 *       200:
 *         description: OK
 */
r.get('/', authJwt, listAlerts);

/**
 * @openapi
 * /api/alerts/{id}/ack:
 *   post:
 *     summary: Confirmar (ack) alerta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
r.post('/:id/ack', authJwt, ackAlert);

/**
 * @openapi
 * /api/alerts/{id}/mute:
 *   post:
 *     summary: Silenciar alerta (por minutos o hasta fecha/hora)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minutes:
 *                 type: integer
 *                 default: 60
 *               until:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: OK
 */
r.post('/:id/mute', authJwt, muteAlert);

/**
 * @openapi
 * /api/alerts/thresholds:
 *   get:
 *     summary: Obtener umbrales (global o por device)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *   put:
 *     summary: Guardar umbrales (upsert) global o por device
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [temperature, humidity, pm25, pm10]
 *             properties:
 *               temperature: { type: number }
 *               humidity:    { type: number }
 *               pm25:        { type: number }
 *               pm10:        { type: number }
 *     responses:
 *       200:
 *         description: OK
 */
r.route('/thresholds')
  .get(authJwt, getThresholds)
  .put(authJwt, putThresholds);

/**
 * @openapi
 * /api/alerts/thresholds/effective:
 *   get:
 *     summary: Ver umbral efectivo y su origen (device|global|default)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
r.get('/thresholds/effective', authJwt, getEffectiveThresholds);

export default r;
