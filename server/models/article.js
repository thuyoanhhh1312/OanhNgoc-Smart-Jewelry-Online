import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Article = sequelize.define(
  "Article",
  {
    article_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    article_category_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(300), allowNull: false, unique: true },
    content: {
      type: DataTypes.TEXT("long"), // đủ cho HTML dài
      allowNull: false,
    },

    excerpt: {
      type: DataTypes.TEXT("medium"), // tóm tắt 1–2 đoạn
      allowNull: true,
    },

    thumbnail_url: { type: DataTypes.STRING(2000), allowNull: true },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      defaultValue: "draft",
    },
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    published_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "article",
    timestamps: false,
  }
);

export default Article;
