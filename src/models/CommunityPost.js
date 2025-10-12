import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class CommunityPost extends Model {}

CommunityPost.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    authorName: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    lat: { type: DataTypes.FLOAT },
    lng: { type: DataTypes.FLOAT },
    status: {
      type: DataTypes.ENUM("visible", "hidden"),
      defaultValue: "visible",
    },
  },
  { sequelize, modelName: "CommunityPost", timestamps: true }
);

export default CommunityPost;
