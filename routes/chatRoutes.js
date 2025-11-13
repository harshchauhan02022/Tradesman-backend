const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protected endpoints - both tradesman & client will call these (role-neutral)
router.post('/send', verifyToken, chatController.sendMessage);               // send message
router.get('/conversation/:userId', verifyToken, chatController.getConversation); // get conversation between me and userId
router.get('/list', verifyToken, chatController.getChatList);               // get chat list (last messages)
router.put('/mark-read', verifyToken, chatController.markAsRead);           // mark messages read

module.exports = router;
