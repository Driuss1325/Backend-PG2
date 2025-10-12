import { Router } from 'express';
import { authJwt } from '../middleware/authJwt.js';
import { requireEnrollToken } from '../middleware/enrollToken.js';
import { userActionLogger } from '../middleware/userActionLogger.js';
import {
  listDevices,
  createDevice,
  enrollDevice,
  revokeApiKey,
  updateDeviceLocation,
  locationHistory
} from '../controllers/devices.controller.js';

const r = Router();

/**
 * @openapi
 * /api/devices:
 *   get:
 *     summary: Listar dispositivos
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     summary: Crear dispositivo
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
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               ownerId:
 *                 type: integer
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       201:
 *         description: Creado
 */
r.get('/', authJwt, userActionLogger('DEVICES_LIST'), listDevices);
r.post('/', authJwt, userActionLogger('DEVICE_CREATE'), createDevice);

/**
 * @openapi
 * /api/devices/{deviceId}/location:
 *   put:
 *     summary: Actualizar ubicación del dispositivo (manual)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: OK
 */
r.put('/:deviceId/location', authJwt, userActionLogger('DEVICE_LOCATION_UPDATE'), updateDeviceLocation);

/**
 * @openapi
 * /api/devices/{deviceId}/location/history:
 *   get:
 *     summary: Historial de ubicación del dispositivo
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
r.get('/:deviceId/location/history', authJwt, locationHistory);

/**
 * @openapi
 * /api/devices/enroll:
 *   post:
 *     summary: Enrolar dispositivo (devuelve apiKey en texto claro)
 *     tags: [Devices]
 *     parameters:
 *       - in: header
 *         name: x-enroll-token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId]
 *             properties:
 *               deviceId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OK
 */
r.post('/enroll', requireEnrollToken, enrollDevice);

/**
 * @openapi
 * /api/devices/{deviceId}/revoke:
 *   post:
 *     summary: Revocar ApiKey de un dispositivo
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
r.post('/:deviceId/revoke', authJwt, userActionLogger('APIKEY_REVOKE'), revokeApiKey);

export default r;
