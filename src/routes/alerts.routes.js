import { Router } from 'express';
import { authJwt } from '../middleware/authJwt.js';
import { listAlerts } from '../controllers/alerts.controller.js';

const r = Router();

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: Listar alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
r.get('/', authJwt, listAlerts);

export default r;
