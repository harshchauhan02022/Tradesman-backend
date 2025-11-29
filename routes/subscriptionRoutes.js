const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Subscription plans screen
router.get("/plans", subscriptionController.getPlans);
router.get("/my", verifyToken, subscriptionController.getMySubscription);
router.post("/upgrade", verifyToken, subscriptionController.upgradePlan);

module.exports = router;
