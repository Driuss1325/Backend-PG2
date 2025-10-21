// src/routes/reports.routes.js
import { Router } from "express";
import { authJwt } from "../middleware/authJwt.js";
import { downloadReportXlsx } from "../controllers/reports.controller.js";

const r = Router();

/**
 * @openapi
 * /api/reports/xlsx:
 *   get:
 *     summary: Descargar reporte de lecturas en Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: XLSX }
 */
r.get("/xlsx", authJwt, downloadReportXlsx);

export default r;
