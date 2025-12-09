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
    // Toxic Filter fields
    is_toxic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    toxic_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    toxic_categories: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    toxic_types: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    toxic_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toxic_confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // Admin review status
    needs_admin_review: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    admin_review_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: true,
    },
    admin_review_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
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
