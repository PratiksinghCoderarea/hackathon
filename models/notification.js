const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    from: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    post: [
        {
            type: Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    to: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;