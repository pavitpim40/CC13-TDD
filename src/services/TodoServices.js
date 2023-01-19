const { Todo } = require('../model');

const createTodo = async (todo) => {
  return await Todo.create(todo);
};

module.exports = { createTodo };
