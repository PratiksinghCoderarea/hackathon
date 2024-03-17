const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupChatSchema = new Schema({
    group_id: {
        type: Schema.Types.ObjectId,
        ref: "Group"
    },
    sender_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    message: {
        type: String
    }
},{timestamps: true});

const GroupChat = mongoose.model('GroupChat', groupChatSchema);

module.exports = GroupChat;