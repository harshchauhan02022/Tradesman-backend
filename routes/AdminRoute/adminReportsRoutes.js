const express = require("express");
const router = express.Router();

const { verifyAdminToken } = require("../../middlewares/adminAuthMiddleware");

const adminReportsController = require(
  "../../controllers/AdminController/adminReportsController"
);

// USERS REPORT
router.get(
  "/reports/users",
  verifyAdminToken,
  adminReportsController.getUsersReport
);

router.get(
  "/reports/users/export",
  verifyAdminToken,
  adminReportsController.exportUsersCSV
);

// SUBSCRIPTIONS REPORT
router.get(
  "/reports/subscriptions",
  verifyAdminToken,
  adminReportsController.getSubscriptionsReport
);

router.get(
  "/reports/subscriptions/export",
  verifyAdminToken,
  adminReportsController.exportSubscriptionsCSV
);

module.exports = router;
