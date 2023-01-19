const { DataTypes, Model } = require('sequelize');
const sequelize = require('../connection/database');

class Todo extends Model {}

Todo.init(
  {
    // Attributes
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    done: {
      type: DataTypes.BOOLEAN,
      default: false,
    },
  },
  {
    sequelize,
    modelName: 'todo',
  }
);
module.exports = Todo;
