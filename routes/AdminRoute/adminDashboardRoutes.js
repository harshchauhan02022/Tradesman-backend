const express = require("express");
const router = express.Router();

const { verifyAdminToken } = require("../../middlewares/adminAuthMiddleware");

const {
  getOverviewStats,
  getAnalytics
} = require("../../controllers/AdminController/adminDashboardController");

/* Dashboard Overview */
router.get("/overview", verifyAdminToken, getOverviewStats);

/* Dashboard Analytics */
router.get("/analytics", verifyAdminToken, getAnalytics);

module.exports = router;
