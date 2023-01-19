const express = require('express');

const authController = require('../controllers/authControllers');
const validateMiddleware = require('../middlewares/validateMiddleware');
const router = express.Router();

router.post('/', validateMiddleware.isEmail, authController.login);

module.exports = router;
