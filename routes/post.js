const express = require("express");
const router = express.Router();
const postController = require("../controllers/post");
const Post = require("../models/post");
const {isLoggedIn, isOwner} = require("../utils/middlewares");
const Notification = require("../models/notification");
const multer  = require('multer');
const {storage} = require("../cloudconfig.js");
const upload = multer({ storage });

// send a new post creation form
router.get("/new", isLoggedIn, postController.renderNewForm);

 
// submit the post creation form and save the data to database and redirect to the home page
router.post("/", isLoggedIn, upload.single("image"), async(req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    let {content} = req.body;
    let newPost = new Post({content});
    newPost.image = {url, filename};
    newPost.creater = req.user;
    await newPost.save();

   res.redirect("/");
});


// two handle interest request and also prevent the page to get refreshed
router.post('/interested', isLoggedIn, async(req, res) => {
    // Handle the like logic here, for example, update a database
    const { postId } = req.body;
    let post = await Post.findById(postId);

    // Perform database update or other actions here
    // -----------------------------------------------------------------------
    // if user have already shown interest in some post then the user will not able to send interest again
    if(post.interested_user.includes(res.locals.currUser._id)) {
        return res.json({ success: true, message: 'already interested user' });
    }

    // creater of the post will not be able to send interest
    if(String(post.creater) == String(res.locals.currUser._id)) { 
        return res.json({ success: true, message: 'creator of the post' });   
    }

    post.interested_user.push(req.user);
    await post.save();
    // req.flash("success", "Response send"); 

    // notification set
    let newNotification = new Notification({});
    newNotification.from.push(req.user);
    newNotification.post.push(post);
    newNotification.to.push(post.creater);
    await newNotification.save();
    // -----------------------------------------------------------------------

    // Send a response to the client
    res.json({ success: true, message: 'Interest request send' });
});


// router.post("/:id/interested", isLoggedIn, async(req, res, next) => {
//     let {id} = req.params;
//     let post = await Post.findById(id);

//     // if user have already shown interest in some post then the user will not able to send interest again
//     if(post.interested_user.includes(res.locals.currUser._id)) {
//         req.flash("error", "You already send a renponse");
//         return res.redirect(`/`);
//     }

//     // creater of the post will not be able to send interest
//     if(String(post.creater) == String(res.locals.currUser._id)) { 
//         req.flash("error", "You have created this post");
//         return res.redirect(`/`);
//     }

//     post.interested_user.push(req.user);
//     await post.save();
//     req.flash("success", "Response send"); 

//     // notification set
//     let newNotification = new Notification({});
//     newNotification.from.push(req.user);
//     newNotification.post.push(post);
//     newNotification.to.push(post.creater);
//     await newNotification.save();

//     res.redirect("/");
// });

router.get("/:id", isLoggedIn, isOwner, async(req, res, next) => {
    let {id} = req.params;
    let post = await Post.findById(id).populate("creater").populate({
        path: 'interested_user',
        populate: {
          path: 'profile_image'
        }
      });
    // console.log(post);
    res.render("posts/singlePost", {post});
});

router.delete("/:id", isLoggedIn, isOwner, async(req, res, next) => {
    let {id} = req.params;
    await Post.findByIdAndDelete(id);
    req.flash("success", "Post deleted"); 
    res.redirect("/");
});

module.exports = router;