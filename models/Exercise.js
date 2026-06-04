const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/database');

class Exercise extends Model {}

Exercise.init(
  {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    calories: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
        isFloat: true
      }
    },
    user: {
        type: DataTypes.STRING,
        allowNull: false,
    }
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Exercise', // We need to choose the model name
  },
);

// the defined model is the class itself
console.log(Exercise === sequelize.models.Exercise); // true

module.exports = Exercise;