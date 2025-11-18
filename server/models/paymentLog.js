import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PaymentLog = sequelize.define(
  "PaymentLog",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    order_code: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },

    gateway: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },

    kind: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },

    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    verified: {
      type: DataTypes.TINYINT(1),
      defaultValue: 0,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payment_logs",
    timestamps: false,
    indexes: [
      {
        fields: ["order_code"],
        name: "idx_order_code",
      },
      {
        fields: ["created_at"],
        name: "idx_created_at",
      },
    ],
  }
);

export default PaymentLog;
