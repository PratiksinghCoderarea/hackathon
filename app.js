if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bodyParser = require('body-parser');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash"); // for flash message
const cookieParser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);

const User = require("./models/user");
const ExpressError = require('./utils/ExpressError');

const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const chatRouter = require("./routes/chat");
const Post = require('./models/post');
const { isLoggedIn, isVerified } = require('./utils/middlewares');
const Chat = require('./models/chat');

async function main() {
    await mongoose.connect(process.env.ATLAS_URL);
}

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// app.use(express.urlencoded({extended: true}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: process.env.ATLAS_URL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 7 * 24 * 60 * 60 * 1000
});

store.on("error", () => {
    console.log("error in mongo session store", err)
})

const sessionOPtions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOPtions));
app.use(cookieParser());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.cookie('user', JSON.stringify(req.user));
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

let usp = io.of("/user-namespace");

usp.on('connection', async (socket) => {
    let userId = socket.handshake.auth.token;
    // changing user status to online and store socket id to database
    await User.findByIdAndUpdate({ _id: userId }, { is_online: "1", socket_id: socket.id });
    socket.broadcast.emit("getOnlineUser", userId);

    // current chat implementation
    socket.on("newChat", async (data) => {
        // find the receiver of the message by using the reveiver id from the data
        // and emit the message to the reveiver socket id 
        let receiver = await User.findById(data.receiver_id);
        // sending the message to receiver socket
        usp.to(receiver.socket_id).emit('loadNewChat', data);
    });

    // listen to the typing status and send typing alert to the receiver
    socket.on("typing", async (data) => {
        let receiver = await User.findById(data.receiver_id);
        usp.to(receiver.socket_id).emit("typing-receiver", data)
    })

    // listen to the typing status and send typing alert to the receiver
    socket.on("stop-typing", async (data) => {
        let receiver = await User.findById(data.receiver_id);
        usp.to(receiver.socket_id).emit("stop-typing-receiver", data)
    })

    socket.on("read-current-message", async (data) => {
        let chat = await Chat.findById(data).populate("sender_id");
        chat.isSeen = true;
        await chat.save();
        usp.to(chat.sender_id.socket_id).emit("read-current-send-message", chat._id);
    })

    socket.on("read-old-message", async (data) => {
        let chat = await Chat.findById(data).populate("sender_id");
        let chats = (await Chat.find({ receiver_id: chat.receiver_id, sender_id: chat.sender_id })).reverse();
        for (oneChat of chats) {
            if (!oneChat.isSeen) {
                oneChat.isSeen = true;
                await oneChat.save();
                console.log(oneChat);
                usp.to(chat.sender_id.socket_id).emit("read-current-send-message", oneChat._id);
                socket.emit("seen-old-chat", oneChat._id)
            } else {
                break;
            }
        }
        // chat.isSeen = true;
        // await chat.save();
        // usp.to(chat.sender_id.socket_id).emit("read-current-send-message", chat._id);
    })

    // implementing old chat
    socket.on("getChats", async (data) => {
        let chats = await Chat.find({
            $or: [
                // own chat
                { receiver_id: data.receiver_id, sender_id: data.sender_id },
                // diatance user chat   
                { receiver_id: data.sender_id, sender_id: data.receiver_id }
            ]
        });

        socket.emit("loadChats", chats);
    });

    socket.on('disconnect', async () => {
        let userId = socket.handshake.auth.token;
        // changing user status to offline and removing socket id form database
        await User.findByIdAndUpdate({ _id: userId }, { is_online: "0", socket_id: "" });
        socket.broadcast.emit("getOfflineUser", userId);
    });
});

app.get("/", isLoggedIn, isVerified, async (req, res, next) => {
    let posts = (await Post.find().populate("creater")).reverse();

    res.render("./posts/index.ejs", { posts });
});

// // two handle interest request and also prevent the page to get refreshed
// app.post('/like', async(req, res) => {
//     // Handle the like logic here, for example, update a database
//     const { postId } = req.body;
//     console.log(postId);
//     let post = await Post.findById(postId);
//     console.log(post)
//     // Perform database update or other actions here

//     // Send a response to the client
//     res.json({ success: true, message: 'Like added successfully' });
// });

app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/chats", chatRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("posts/error.ejs", { message });
});

server.listen(8080, () => {
    console.log(`listening to port 8080`);
});