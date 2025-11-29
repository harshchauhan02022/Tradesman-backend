// controllers/chatController.js
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');

// POST /api/chat/send
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, message } = req.body;

    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'receiverId and message required' });
    }

    const newMsg = await Message.create({ senderId, receiverId, message });

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      data: newMsg
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chat/conversation/:userId
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const otherId = parseInt(req.params.userId, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!otherId || Number.isNaN(otherId)) {
      return res.status(400).json({ success: false, message: 'other userId required' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error('getConversation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/chat/list  -> last message with each user
exports.getChatList = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const msgs = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    const convMap = new Map();

    for (const m of msgs) {
      const other = (m.senderId === userId) ? m.receiverId : m.senderId;
      if (!convMap.has(other)) {
        convMap.set(other, m); // first = latest (DESC order)
      }
    }

    const chatList = [];
    for (const [otherId, lastMsg] of convMap.entries()) {
      const otherUser = await User.findByPk(otherId, {
        attributes: ['id', 'name', 'email', 'role', 'profileImage']
      });

      chatList.push({
        withUser: otherUser || { id: otherId },
        lastMessage: lastMsg
      });
    }

    return res.status(200).json({ success: true, data: chatList });
  } catch (err) {
    console.error('getChatList error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/chat/mark-read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { conversationWith } = req.body; // other user id

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!conversationWith) {
      return res.status(400).json({ success: false, message: 'conversationWith required' });
    }

    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          senderId: conversationWith,
          receiverId: userId,
          isRead: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Marked as read',
      updated: updatedCount
    });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
