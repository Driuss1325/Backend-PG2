import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class DeviceLog extends Model {}

DeviceLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deviceId: { type: DataTypes.INTEGER, allowNull: false },
    event: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.JSON },
  },
  { sequelize, modelName: "DeviceLog", timestamps: true }
);

export default DeviceLog;
