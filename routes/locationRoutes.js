const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Create travel plan
router.post("/", verifyToken, locationController.createTravelPlan);

// My travel plans
router.get("/my", verifyToken, locationController.getMyTravelPlans);

// Update travel plan
router.put("/:id", verifyToken, locationController.updateTravelPlan);

// Delete travel plan
router.delete("/:id", verifyToken, locationController.deleteTravelPlan);

// Tradesman public profile
router.get("/tradesman/:tradesmanId", locationController.getTradesmanProfile);

module.exports = router;
