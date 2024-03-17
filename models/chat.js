const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    receiver_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    sender_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    message: {
        type: String
    },
    isSeen: {
        type: Boolean,
        default: false,
        required: true
    }
},{timestamps: true});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;