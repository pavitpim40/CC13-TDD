const { Todo } = require('../model');
const TodoServices = require('../services/TodoServices');
exports.createTodo = async (req, res, next) => {
  try {
    const todo = req.body;
    const newTodo = await TodoServices.createTodo(todo);
    res.status(201).json({ todo: newTodo });
  } catch (error) {
    next(error);
  }
};

exports.updateTodo = async (req, res, next) => {
  try {
    const todoId = req.params.todoId;
    const newTodo = req.body;
    const updateTodo = await Todo.update(newTodo, { where: { id: todoId } });
    if (!updateTodo) {
      return res.status(404).json({ message: 'todo not found' });
    }

    res.status(200).json({ message: 'updated todo' });
  } catch (error) {
    next(error);
  }
};

exports.getTodoById = async (req, res, next) => {
  try {
    const todoId = req.params.todoId;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ message: 'cannot find todo' });
    }
    console.log('G');
    console.log(todo);
    return res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
};
