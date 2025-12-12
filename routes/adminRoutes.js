const express = require('express');
const router = express.Router();
const adminAuth = require('../controllers/adminAuthController');

router.post('/register', adminAuth.registerAdmin);
router.post('/login', adminAuth.login);   // <-- only this is correct

module.exports = router;
