// src/routes/devices.routes.js
import { Router } from 'express';
import { authJwt } from '../middleware/authJwt.js';
import { requireEnrollToken } from '../middleware/enrollToken.js';
import { userActionLogger } from '../middleware/userActionLogger.js';
import {
  listDevices,
  createDevice,
  enrollDevice,
  revokeApiKey,
  updateDevice,
  updateDeviceLocation,
  locationHistory,
  updateDeviceStatus
} from '../controllers/devices.controller.js';

const r = Router();

/**
 * @openapi
 * /api/devices:
 *   get:
 *     summary: "Listar dispositivos (incluye lastLocation si existe)"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: "Crear dispositivo"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               ownerId: { type: integer }
 *               lat: { type: number }
 *               lng: { type: number }
 *               location:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lng: { type: number }
 *     responses:
 *       201: { description: Creado }
 */
r.get('/', authJwt, userActionLogger('DEVICES_LIST'), listDevices);
r.post('/', authJwt, userActionLogger('DEVICE_CREATE'), createDevice);

/**
 * ⚠️ Rutas específicas antes de /:deviceId
 */

/**
 * @openapi
 * /api/devices/status:
 *   put:
 *     summary: "Cambiar estado del dispositivo por body"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId, status]
 *             properties:
 *               deviceId: { type: integer }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: OK }
 */
r.put('/status', authJwt, userActionLogger('DEVICE_STATUS_UPDATE'), updateDeviceStatus);

/**
 * @openapi
 * /api/devices/enroll:
 *   post:
 *     summary: "Enrolar dispositivo (devuelve apiKey en texto claro)"
 *     tags: [Devices]
 *     parameters:
 *       - in: header
 *         name: x-enroll-token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId]
 *             properties:
 *               deviceId: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
r.post('/enroll', requireEnrollToken, enrollDevice);

/**
 * @openapi
 * /api/devices/{deviceId}/revoke:
 *   post:
 *     summary: "Revocar ApiKey de un dispositivo"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
r.post('/:deviceId/revoke', authJwt, userActionLogger('APIKEY_REVOKE'), revokeApiKey);

/**
 * @openapi
 * /api/devices/{deviceId}/location:
 *   put:
 *     summary: "Actualizar ubicación del dispositivo (manual)"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200: { description: OK }
 */
r.put('/:deviceId/location', authJwt, userActionLogger('DEVICE_LOCATION_UPDATE'), updateDeviceLocation);

/**
 * @openapi
 * /api/devices/{deviceId}/location/history:
 *   get:
 *     summary: "Historial de ubicación del dispositivo (más recientes primero)"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 500, maximum: 1000 }
 *     responses:
 *       200: { description: OK }
 */
r.get('/:deviceId/location/history', authJwt, locationHistory);

/**
 * @openapi
 * /api/devices/{deviceId}/status:
 *   put:
 *     summary: "Cambiar estado del dispositivo (compat por path)"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: OK }
 */
r.put('/:deviceId/status', authJwt, userActionLogger('DEVICE_STATUS_UPDATE'), updateDeviceStatus);

/**
 * @openapi
 * /api/devices/{deviceId}:
 *   put:
 *     summary: "Actualizar dispositivo (name, ownerId, lat/lng)"
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               ownerId: { type: integer }
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200: { description: OK }
 */
r.put('/:deviceId', authJwt, userActionLogger('DEVICE_UPDATE'), updateDevice);

export default r;
