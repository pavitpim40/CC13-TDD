const express = require('express');
const validateMiddleware = require('../middlewares/validateMiddleware');
const userController = require('../controllers/userControllers');

const router = express.Router();

const { checkUsernameRegister, checkEmailRegister, checkPasswordRegister } = validateMiddleware;
router.post('/', checkUsernameRegister, checkEmailRegister, checkPasswordRegister, userController.register);
router.post('/token/:activationToken', userController.activateAccount);

module.exports = router;
