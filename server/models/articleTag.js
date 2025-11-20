import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ArticleTag = sequelize.define(
  "ArticleTag",
  {
    article_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    tag_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  },
  { tableName: "article_tag", timestamps: false }
);

export default ArticleTag;
