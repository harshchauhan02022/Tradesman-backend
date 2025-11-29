// routes/hireRoutes.js
const express = require('express');
const router = express.Router();
const hireController = require('../controllers/hireController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Client → create hire request
router.post('/request', verifyToken, hireController.requestHire);

// Tradesman → accept / reject
router.post('/respond', verifyToken, hireController.respondHire);

// Client → mark as completed
router.post('/complete', verifyToken, hireController.completeHire);

// Get current/latest hire status between me & other user (for chat screen)
router.get('/status/:userId', verifyToken, hireController.getHireStatusForConversation);

module.exports = router;
