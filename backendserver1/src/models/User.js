const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

class User extends Model {
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

module.exports = (sequelize) => {
  User.init({
    id: { 
      type: DataTypes.BIGINT, 
      autoIncrement: true, 
      primaryKey: true 
    },
    email: { 
      type: DataTypes.STRING(255), 
      allowNull: false, 
      unique: true 
    },
    password: { 
      type: DataTypes.CHAR(64), 
      allowNull: false 
    },
    token: { 
      type: DataTypes.STRING(255), 
      unique: true 
    },
    token_expired_at: { 
      type: DataTypes.DATE 
    },
    train_id: { 
      type: DataTypes.STRING(255) 
    },
    train_id_expired_at: { 
      type: DataTypes.DATE 
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    },
  });
  return User;
};