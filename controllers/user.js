const User = require("../models/user");
const mailSender = require("../utils/mail.js");
const otpGenerator = require('otp-generator');

module.exports.renderSignupForm = (req, res, next) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        console.log(password)
        // generate otp using 
        let otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        // console.log(otp);
        // register a new user
        let newUser = new User({ username, email, otp });
        const registeredUser = await User.register(newUser, password);

        // sending email to the email given by the user along with otp
        mailSender(email, otp);

        // auto login after susscfull signup
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            // req.flash("success", "Signup successfull");
            res.cookie('user', JSON.stringify(req.user));
            // redirect to the home page
            res.redirect("/users/verify-email");
        })
    } catch (err) { // when username or email already exist
        req.flash("error", err.message);
        res.redirect("/users/signup");
    }
};

module.exports.renderLoginForm = (req, res, next) => {
    if (req.user) {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "You logged out successfully");
            return res.render("users/login.ejs");
        });
    } else {
        return res.render("users/login.ejs");
    }
};

// if user email not verified then verify
module.exports.login = async (req, res, next) => {
    res.cookie('user', JSON.stringify(req.user));
    req.flash("success", "Login successfull");
    res.redirect("/");
};

module.exports.renderVerifyEmailForm = async (req, res, next) => {
    // when user already verified return to the main page
    if (req.user.isVerified) {
        return res.redirect("/");
    }
    res.render("users/verifyEmail.ejs");
};

module.exports.verifyEmail = async (req, res, next) => {
    const otpArray = req.body.otp;
    const joinedString = otpArray.join('');
    const resultNumber = parseInt(joinedString, 10);

    let user = await User.findOne({ _id: String(req.user._id) });

    // when user already verified return to the main page
    if (user.isVerified) {
        return res.redirect("/");
    }

    if (resultNumber == user.otp) {  // if correct otp entered then update isVerified = true
        user.isVerified = true;
        await user.save();
    } else {
        return res.redirect("/users/verify-email");
    }

    res.redirect("/");
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You logged out successfully");
        res.redirect("/");
    });
};