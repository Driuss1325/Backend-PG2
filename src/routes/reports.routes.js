import { Router } from 'express';
import { authJwt } from '../middleware/authJwt.js';
import { downloadReport } from '../controllers/reports.controller.js';

const r = Router();

/**
 * @openapi
 * /api/reports/pdf:
 *   get:
 *     summary: Descargar reporte PDF de lecturas
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dateFrom
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: PDF
 */
r.get('/pdf', authJwt, downloadReport);

export default r;
