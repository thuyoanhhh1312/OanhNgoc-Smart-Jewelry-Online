import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PasswordResetRateLimit = sequelize.define(
  "PasswordResetRateLimit",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    request_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    window_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "password_reset_rate_limits",
    timestamps: false,
    indexes: [
      {
        fields: ["email"],
      },
    ],
  }
);

export default PasswordResetRateLimit;
