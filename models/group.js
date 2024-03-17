const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: true
    },
    post_id: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    }
},{timestamps: true});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;