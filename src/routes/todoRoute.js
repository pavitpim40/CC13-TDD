const express = require('express');
const router = express.Router();
const TodoController = require('../controllers/todoController');

router.post('/', TodoController.createTodo);
router.put('/:todoId', TodoController.updateTodo);
router.get('/:todoId', TodoController.getTodoById);
module.exports = router;
