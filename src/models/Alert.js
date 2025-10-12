import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Alert extends Model {}

Alert.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deviceId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    level: {
      type: DataTypes.ENUM("info", "warning", "critical"),
      defaultValue: "info",
    },
  },
  { sequelize, modelName: "Alert", timestamps: true }
);

export default Alert;
