const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/database')

class User extends Model {}

User.init(
  {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    weight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: true
        }  
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true
        }
    },
    height: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    }
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'User', // We need to choose the model name, ESTO SE CAMBIA SI EL NOMBRE DEL MODELO ES DISTINTO A 'User'
  },
);

// the defined model is the class itself
console.log(User === sequelize.models.User); // true

module.exports = User;  // Important epara exportar