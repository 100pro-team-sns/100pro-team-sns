const { Model, DataTypes } = require('sequelize');

class Room extends Model {}

module.exports = (sequelize) => {
  Room.init({
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    user_id_1: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      references: { 
        model: 'users', 
        key: 'id' 
      } 
    },
    user_id_2: { 
      type: DataTypes.BIGINT, 
      allowNull: false, 
      references: { 
        model: 'users', 
        key: 'id' 
      } 
    },
    expired_at: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
  }, {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    timestamps: false,
  });
  return Room;
};