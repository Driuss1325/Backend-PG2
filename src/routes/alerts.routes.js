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
 *       200: { description: OK }
 */
r.get('/', authJwt, listAlerts);

r.post('/:id/ack', authJwt, ackAlert);
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
 *   put:
 *     summary: "Guardar umbrales (upsert) global o por device"
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema: { type: integer }
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
 *       200: { description: OK }
 */
r.get('/thresholds/effective', authJwt, getEffectiveThresholds);

export default r;
