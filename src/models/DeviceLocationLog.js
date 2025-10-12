import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class DeviceLocationLog extends Model {}

DeviceLocationLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deviceId: { type: DataTypes.INTEGER, allowNull: false },
    lat: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
    lng: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
    source: { type: DataTypes.ENUM("agent", "manual"), defaultValue: "agent" },
    accuracy: { type: DataTypes.FLOAT },
  },
  { sequelize, modelName: "DeviceLocationLog", timestamps: true }
);

export default DeviceLocationLog;
