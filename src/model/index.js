const Todo = require('./Todo');
const User = require('./User');

User.hasMany(Todo, { as: 'todos' });
Todo.belongsTo(User);

module.exports = { User, Todo };
