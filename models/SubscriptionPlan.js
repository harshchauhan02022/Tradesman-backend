// models/SubscriptionPlan.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SubscriptionPlan = sequelize.define(
  "SubscriptionPlan",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false, // "Free Trial", "Pro", "Elite"
    },

    priceMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    maxSharedLocations: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = unlimited
    },

    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "subscription_plans",
    timestamps: true,
  }
);

module.exports = SubscriptionPlan;
