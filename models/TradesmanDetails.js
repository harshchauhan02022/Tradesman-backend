// models/TradesmanDetails.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const TradesmanDetails = sequelize.define(
  "TradesmanDetails",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: {
      type: DataTypes.INTEGER,
      references: { model: "Users", key: "id" },
      allowNull: false,
    },

    tradeType: { type: DataTypes.STRING },
    businessName: { type: DataTypes.STRING },
    shortBio: { type: DataTypes.TEXT },
    licenseNumber: { type: DataTypes.STRING },
    licenseExpiry: { type: DataTypes.DATE },
    licenseDocument: { type: DataTypes.STRING }, // filename
    portfolioPhotos: { type: DataTypes.JSON },
    portfolioDescription: { type: DataTypes.TEXT },

    isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },

    // audit
    approvedBy: { type: DataTypes.INTEGER, allowNull: true, comment: "admin user id who approved" },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true }
  },
  {
    timestamps: true,
    tableName: "TradesmanDetails",
  }
);

// relations
User.hasOne(TradesmanDetails, { foreignKey: "userId", as: "TradesmanDetail" });
TradesmanDetails.belongsTo(User, { foreignKey: "userId" });

module.exports = TradesmanDetails;
