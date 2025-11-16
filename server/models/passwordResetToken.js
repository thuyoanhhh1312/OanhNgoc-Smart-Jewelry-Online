import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "password_reset_tokens",
    timestamps: false,
    indexes: [
      {
        fields: ["email"],
      },
      {
        fields: ["expired_at"],
      },
    ],
  }
);

export default PasswordResetToken;
