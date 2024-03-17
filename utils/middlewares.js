const Post = require("../models/post");
const User = require("../models/user");

module.exports.isLoggedIn = (req, res, next) => {
    if(req.user) {
        return next();
    }
    res.redirect("/users/login");
};

// String(post.creater) == String(res.locals.currUser._id
module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let post = await Post.findById(id);
    if(String(post.creater) != String(res.locals.currUser._id)) {
        req.flash("error", "You didn't create this post");
        return res.redirect(`/`);
    }
    next();
};

module.exports.isVerified = async (req, res, next) => {
    let user = await User.findOne({_id: String(req.user._id)});
    if(user.isVerified) {   
        return next();
    }
    res.redirect("/users/verify-email");
};