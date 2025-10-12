import { Router } from 'express';
import { authJwt } from '../middleware/authJwt.js';
import { publicList, publicCreate, adminHide } from '../controllers/community.controller.js';

const r = Router();

/**
 * @openapi
 * /api/community/public:
 *   get:
 *     summary: Listar posts públicos (visibles)
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: Crear post público (sin login)
 *     tags: [Community]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [authorName, content]
 *             properties:
 *               authorName:
 *                 type: string
 *               content:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       201:
 *         description: Creado
 */
r.get('/public', publicList);
r.post('/public', publicCreate);

/**
 * @openapi
 * /api/community/{id}/hide:
 *   post:
 *     summary: Ocultar post (requiere login)
 *     tags: [Community]
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
r.post('/:id/hide', authJwt, adminHide);

export default r;
