const { Model, DataTypes } = require('sequelize');

class Chat extends Model {}

module.exports = (sequelize) => {
  Chat.init({
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    room_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { 
        model: 'rooms', 
        key: 'id' 
      } 
    },
    user_id: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      references: { 
        model: 'users', 
        key: 'id' 
      } 
    },
    created_at: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
    context: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    link: { 
      type: DataTypes.STRING(255) 
    },
  }, {
    sequelize,
    modelName: 'Chat',
    tableName: 'chats',
    timestamps: false,
  });
  return Chat;
};