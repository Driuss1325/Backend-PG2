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
 *     summary: "Listar alertas"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema: { type: integer }
 *       - in: query
 *         name: since
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: until
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: acknowledged
 *         schema: { type: string, enum: [true, false] }
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
 *                   type:        { type: string }
 *                   message:     { type: string }
 *                   level:       { type: string, enum: [info, warning, critical] }
 *                   acknowledged:{ type: boolean, nullable: true }
 *                   acknowledgedAt: { type: string, format: date-time, nullable: true }
 *                   mutedUntil:  { type: string, format: date-time, nullable: true }
 *                   createdAt:   { type: string, format: date-time }
 *                   updatedAt:   { type: string, format: date-time }
 */
r.get('/', authJwt, listAlerts);

/**
 * @openapi
 * /api/alerts/{id}/ack:
 *   post:
 *     summary: "Confirmar (ack) alerta"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *       404:
 *         description: Alert not found
 */
r.post('/:id/ack', authJwt, ackAlert);

/**
 * @openapi
 * /api/alerts/{id}/mute:
 *   post:
 *     summary: "Silenciar alerta (por minutos o hasta fecha/hora)"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minutes: { type: integer, default: 60 }
 *               until:   { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 mutedUntil: { type: string, format: date-time }
 *       404:
 *         description: Alert not found
 */
r.post('/:id/mute', authJwt, muteAlert);

/**
 * @openapi
 * /api/alerts/thresholds:
 *   get:
 *     summary: "Obtener umbrales (global o por device)"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Umbrales actuales (device/global/default)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temperature: { type: number, example: 45 }
 *                 humidity:    { type: number, example: 15 }
 *                 pm25:        { type: number, example: 100 }
 *                 pm10:        { type: number, example: 150 }
 *   put:
 *     summary: "Guardar umbrales (upsert) global o por device"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [temperature, humidity, pm25, pm10]
 *             properties:
 *               temperature: { type: number, example: 45 }
 *               humidity:    { type: number, example: 15 }
 *               pm25:        { type: number, example: 100 }
 *               pm10:        { type: number, example: 150 }
 *     responses:
 *       200:
 *         description: Umbrales guardados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 */
r.route('/thresholds')
  .get(authJwt, getThresholds)
  .put(authJwt, putThresholds);

/**
 * @openapi
 * /api/alerts/thresholds/effective:
 *   get:
 *     summary: "Ver umbral efectivo y su origen (device|global|default)"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                   enum: [device, global, default]
 *                 thresholds:
 *                   type: object
 *                   properties:
 *                     temperature: { type: number }
 *                     humidity:    { type: number }
 *                     pm25:        { type: number }
 *                     pm10:        { type: number }
 */
r.get('/thresholds/effective', authJwt, getEffectiveThresholds);

export default r;
