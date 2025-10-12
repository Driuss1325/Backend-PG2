import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class UserLog extends Model {}

UserLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    metadata: { type: DataTypes.JSON },
  },
  { sequelize, modelName: "UserLog", timestamps: true }
);

export default UserLog;
