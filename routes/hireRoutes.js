const express = require("express");
const router = express.Router();
const hireController = require("../controllers/hireController");
const { verifyToken } = require("../middlewares/authMiddleware");

// 1. Client → send hire request
router.post("/request", verifyToken, hireController.requestHire);

// 2. Tradesman → accept / reject
router.post("/respond", verifyToken, hireController.respondHire);

// 3. Tradesman → request job completion
router.post("/request-complete", verifyToken, hireController.requestJobCompletion);

// 4. Client → YES / NO completion
router.post("/confirm-complete", verifyToken, hireController.confirmJobCompletion);

// 5. Chat → latest hire status
router.get("/status/:userId", verifyToken, hireController.getHireStatusForConversation);

// 6. Client → pending completion check
router.get("/pending-complete/:hireId", verifyToken, hireController.getPendingCompletionStatus);

// 7. My jobs
router.get("/my", verifyToken, hireController.getMyJobs);

module.exports = router;
