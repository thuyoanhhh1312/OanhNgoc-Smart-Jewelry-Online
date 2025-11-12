import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PromotionCampaign = sequelize.define(
  "PromotionCampaign",
  {
    campaign_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "promotion_campaign",
    timestamps: false,
    indexes: [
      {
        fields: ["is_active", "start_date", "end_date"],
        name: "idx_campaign_active_dates",
      },
    ],
  }
);

export default PromotionCampaign;
