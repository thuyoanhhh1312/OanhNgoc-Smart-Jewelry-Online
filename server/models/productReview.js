import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ProductReview = sequelize.define(
  "ProductReview",
  {
    review_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sentiment: {
      type: DataTypes.STRING(10), // POS, NEG, NEU, UNC (max 10 chars)
      allowNull: true,
    },
    sentiment_confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    is_meta_review: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    meta_confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    use_for_stats: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_suspicious: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    suspicious_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hidden_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "product_review",
    timestamps: false,
  }
);

export default ProductReview;
