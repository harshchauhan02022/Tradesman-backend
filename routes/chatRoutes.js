// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protected endpoints - tradesman & client both
router.post('/send', verifyToken, chatController.sendMessage);
router.get('/conversation/:userId', verifyToken, chatController.getConversation);
router.get('/list', verifyToken, chatController.getChatList);
router.put('/mark-read', verifyToken, chatController.markAsRead);

module.exports = router;
