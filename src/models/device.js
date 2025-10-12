import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Device extends Model {}

Device.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING },
    lat: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
    lng: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: "Device" }
);

export default Device;
