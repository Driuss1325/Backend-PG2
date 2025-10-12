import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "operator"),
      defaultValue: "operator",
    },
  },
  { sequelize, modelName: "User" }
);

export default User;
