import { sequelize } from "../config/db.js";
import User from "./User.js";
import Device from "./Device.js";
import DeviceLocationLog from "./DeviceLocationLog.js";
import ApiKey from "./ApiKey.js";
import Reading from "./Reading.js";
import Alert from "./Alert.js";
import UserLog from "./UserLog.js";
import DeviceLog from "./DeviceLog.js";
import CommunityPost from "./CommunityPost.js";

// Relaciones
User.hasMany(Device, { foreignKey: "ownerId" });
Device.belongsTo(User, { as: "owner", foreignKey: "ownerId" });

Device.hasMany(Reading, { foreignKey: "deviceId" });
Reading.belongsTo(Device, { foreignKey: "deviceId" });

Device.hasMany(Alert, { foreignKey: "deviceId" });
Alert.belongsTo(Device, { foreignKey: "deviceId" });

Device.hasOne(ApiKey, { foreignKey: "deviceId" });
ApiKey.belongsTo(Device, { foreignKey: "deviceId" });

User.hasMany(UserLog, { foreignKey: "userId" });
UserLog.belongsTo(User, { foreignKey: "userId" });

Device.hasMany(DeviceLog, { foreignKey: "deviceId" });
DeviceLog.belongsTo(Device, { foreignKey: "deviceId" });

Device.hasMany(DeviceLocationLog, { foreignKey: "deviceId" });
DeviceLocationLog.belongsTo(Device, { foreignKey: "deviceId" });

export {
  sequelize,
  User,
  Device,
  DeviceLocationLog,
  ApiKey,
  Reading,
  Alert,
  UserLog,
  DeviceLog,
  CommunityPost,
};
