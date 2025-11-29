// models/hireModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Hire = sequelize.define('Hire', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  tradesmanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },

  // pending -> accepted -> completed  (ya rejected/cancelled)
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },

  // optional extra info (job detail etc.)
  jobDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'hires',   // phpMyAdmin me jo table ka naam hai, wahi rakho
  timestamps: true
});

// (optional associations)
Hire.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
Hire.belongsTo(User, { as: 'tradesman', foreignKey: 'tradesmanId' });

module.exports = Hire;
