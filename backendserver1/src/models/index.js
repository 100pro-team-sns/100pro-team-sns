const { sequelize } = require('../services/db');

const User = require('./User')(sequelize);
const Room = require('./Room')(sequelize);
const Chat = require('./Chat')(sequelize);

User.hasMany(Room, { as: 'roomsAsUser1', foreignKey: 'user_id_1' });
User.hasMany(Room, { as: 'roomsAsUser2', foreignKey: 'user_id_2' });
User.hasMany(Chat, { foreignKey: 'user_id' });

Room.belongsTo(User, { as: 'user1', foreignKey: 'user_id_1' });
Room.belongsTo(User, { as: 'user2', foreignKey: 'user_id_2' });
Room.hasMany(Chat, { foreignKey: 'room_id' });

Chat.belongsTo(User, { foreignKey: 'user_id' });
Chat.belongsTo(Room, { foreignKey: 'room_id' });

module.exports = {
  sequelize,
  User,
  Room,
  Chat
};