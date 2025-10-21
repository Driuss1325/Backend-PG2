import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class AlertThreshold extends Model {}

AlertThreshold.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deviceId: { type: DataTypes.INTEGER, allowNull: true, unique: true }, // null = global
    temperature: { type: DataTypes.FLOAT, allowNull: false },
    humidity: { type: DataTypes.FLOAT, allowNull: false },
    pm25: { type: DataTypes.FLOAT, allowNull: false },
    pm10: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, modelName: "AlertThreshold", timestamps: true }
);

export default AlertThreshold;
