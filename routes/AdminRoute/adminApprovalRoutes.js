const express = require("express");
const router = express.Router();

const { verifyAdminToken } = require("../../middlewares/adminAuthMiddleware");
const tradesmanApprovalController = require("../../controllers/tradesmanApprovalController");

/* Pending tradesmen */
router.get(
  "/tradesmen/pending",
  verifyAdminToken,
  tradesmanApprovalController.getPending
);

/* Approve */
router.post(
  "/tradesmen/:userId/approve",
  verifyAdminToken,
  tradesmanApprovalController.approve
);
    
/* Reject */
router.post(
  "/tradesmen/:userId/reject",
  verifyAdminToken,
  tradesmanApprovalController.reject
);

/* Single tradesman */
router.get(
  "/tradesmen/:userId",
  verifyAdminToken,
  tradesmanApprovalController.getOne
);

module.exports = router;
