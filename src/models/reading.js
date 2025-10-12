import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Reading extends Model {}

Reading.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deviceId: { type: DataTypes.INTEGER, allowNull: false },
    temperature: { type: DataTypes.FLOAT },
    humidity: { type: DataTypes.FLOAT },
    pm25: { type: DataTypes.FLOAT },
    pm10: { type: DataTypes.FLOAT },
  },
  { sequelize, modelName: "Reading", timestamps: true }
);

export default Reading;
