const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    image: {
        url: String,
        filename: String
    },
    modified_at: {
        type: Date,
        default: Date.now()
    },
    creater: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    interested_user: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;