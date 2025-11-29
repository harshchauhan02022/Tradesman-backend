const express = require("express");
const router = express.Router();
const travelPlanController = require("../controllers/travelPlanController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Home screen form
router.post("/", verifyToken, travelPlanController.createTravelPlan);
router.get("/my", verifyToken, travelPlanController.getMyTravelPlans);

// option: public listing
// const { getAllTravelPlans } = travelPlanController;
// router.get("/", getAllTravelPlans);

module.exports = router;
