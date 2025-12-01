import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PromotionLog = sequelize.define(
  "PromotionLog",
  {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id", // DB column is `id`
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    promotion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    email_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "sent", // 'sent', 'failed', 'pending'
    },

    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "promotion_logs",
    timestamps: false,
    indexes: [
      {
        fields: ["customer_id", "promotion_id"],
        unique: true,
        name: "idx_unique_customer_promotion",
      },
      {
        fields: ["sent_at"],
        name: "idx_sent_at",
      },
    ],
  }
);

export default PromotionLog;
