const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getCurrentUser } = require('../controllers/auth.controller');

const router = express.Router();

router.get('/me', authenticate, getCurrentUser);

module.exports = router;
