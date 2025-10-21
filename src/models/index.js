import { sequelize } from "../config/db.js";
import User from "./User.js";
import Device from "./Device.js";
import DeviceLocationLog from "./DeviceLocationLog.js";
import ApiKey from "./ApiKey.js";
import Reading from "./Reading.js";
import Alert from "./Alert.js";
import AlertThreshold from "./AlertThreshold.js";
import UserLog from "./UserLog.js";
import DeviceLog from "./DeviceLog.js";
import CommunityPost from "./CommunityPost.js";

// ─────────────────────────────────────────────────────────────
// Relaciones

// Usuarios ↔ Dispositivos
User.hasMany(Device, { foreignKey: "ownerId" });
Device.belongsTo(User, { as: "owner", foreignKey: "ownerId" });

// Dispositivos ↔ Lecturas
Device.hasMany(Reading, { foreignKey: "deviceId" });
Reading.belongsTo(Device, { foreignKey: "deviceId" });

// Dispositivos ↔ Alertas
Device.hasMany(Alert, { foreignKey: "deviceId" });
Alert.belongsTo(Device, { foreignKey: "deviceId" });

// Dispositivos ↔ ApiKey (1:1)
Device.hasOne(ApiKey, { foreignKey: "deviceId" });
ApiKey.belongsTo(Device, { foreignKey: "deviceId" });

// Usuarios ↔ Logs de usuario
User.hasMany(UserLog, { foreignKey: "userId" });
UserLog.belongsTo(User, { foreignKey: "userId" });

// Dispositivos ↔ Logs de dispositivo
Device.hasMany(DeviceLog, { foreignKey: "deviceId" });
DeviceLog.belongsTo(Device, { foreignKey: "deviceId" });

// Dispositivos ↔ Historial de ubicación
Device.hasMany(DeviceLocationLog, { foreignKey: "deviceId" });
DeviceLocationLog.belongsTo(Device, { foreignKey: "deviceId" });

// Dispositivos ↔ Umbrales (1:1 por device; global = deviceId NULL)
Device.hasOne(AlertThreshold, { foreignKey: "deviceId" });
AlertThreshold.belongsTo(Device, { foreignKey: "deviceId" });

// ─────────────────────────────────────────────────────────────
// Exports

export {
  sequelize,
  User,
  Device,
  DeviceLocationLog,
  ApiKey,
  Reading,
  Alert,
  AlertThreshold,
  UserLog,
  DeviceLog,
  CommunityPost,
};
