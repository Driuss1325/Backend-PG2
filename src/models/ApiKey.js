import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class ApiKey extends Model {}

ApiKey.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deviceId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    keyHash: { type: DataTypes.STRING, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: "ApiKey" }
);

export default ApiKey;
