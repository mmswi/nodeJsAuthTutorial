const express = require("express");
const bodyParser = require("body-parser");
const sessions = require("client-sessions");
const bcrypt = require("bcryptjs");
const csurf = require("csurf");
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/nodeAuthTest', {useNewUrlParser: true});


const app = express();

const User = mongoose.model("User", new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
}));

// setting the view engine to pug
app.set("view engine", "pug");

// sing body-parser middleware
app.use(bodyParser.urlencoded({
    extended: false
}));

// using cookie-sessions middleware
app.use(sessions({
    cookieName: "session",
    secret: "mySuperSecret", // this should be the same on all servers and not pushed to the repo, like here
    duration: 30 * 60 * 1000, // 30 mins
    // httpOnly: true, // don't let javascript access cookies
    // secure: true, // only set cookies over https
    // ephemeral: true, // destroy cookies when the browser closes
}));

// middleware that prevents cross site forgery
// IMPORTANT - use this middleware after you use sessions and cookieParser middlewares
/*
 Strategy steps: 
    1. generate a random web token
    2. store that token in a cookie
    3. add that token in a hidden input field in the forms that post to our server
    4. if the cookie is the same as the value in the input field, then the request is to be trusted
*/
app.use(csurf());

// middleware that checks for sesion id and stores user in req and res
app.use((req, res, next) => {
    if(!(req.session && req.session.userId)) {
        // if we don't have a session and session cookie, don't do anything
        return next();
    }

    // look for the user in the db, by the id from the cookie
    //  whenever the user refreshes the page, if the cookie matches the id in the db, he no longer has to login
    User.findById(req.session.userId, (err, user) => {
        if (err) {
            return next(err);
        } else if(!user) {
            // if there is no user in the db, redirect him to login
            return next();
        } else {
            // if user found - just store it as an object
            console.log("Evrika, correct user in middleware!")
            // don't need to save the password in req and res
            user.password = undefined;

            // setting the user in the req so we can access it in later calls from here
            req.user = user;
            // res.locals allows us to access the user variable in the html templates
            res.locals.user = user;
            console.log("req.user found is: ", req.user);
            next();

        }
    }) 
})

// middleware to use on route gets / posts where the user needs to be authenticated
function loginRequired(req, res, next) {
    if (!req.user) {
        return res.redirect("/login")
    } else {
        // go through if you have the user set
        next();
    }    
}

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    // using the csurf token
    res.render("register", {csrfToken: req.csrfToken()});
});

app.post("/register", (req, res) => {
    // hashing the password and re-assigning it to req.body so it can be stored as hashed in the db
    // 14 tells bcrypt how strong the hash should be
    const hash = bcrypt.hashSync(req.body.password, 14);
    req.body.password = hash;
    const user = new User(req.body);

    console.log("user is: ", user);
    console.log("req body is: ", req.body)

    user.save((err) => {

        if(err) {
            console.log("we have error...", err)
            let error = "No good db";

            if(err.code = 11000) {
                error = "Email already used";
            }

            return res.render("register", {error: error})
        } else {
            res.redirect("/dashboard");
        }
    });

});

app.get("/login", (req, res) => {
    // using the csurf token
    res.render("login", {csrfToken: req.csrfToken()});
});

app.post("/login", (req, res) => {
    User.findOne({email: req.body.email}, (err, user) => {
        // using bcrypt to compare the entered text password with the hashed version from the db
        if(err || !user || !bcrypt.compareSync(req.body.password, user.password)) {
            console.log("comparing: ", req.body.password, "with ", user.password, "and result is: ", bcrypt.compareSync(req.body.password, user.password))
            return res.render("login", {error: "Incorrect email or password"});
        } else {
            // setting the userId cookie to the user id from mongodb
            // this cookie will tell the server it's the same user making the requests
            // 'session' name was declared in the middleware
            console.log("comparing: ", req.body.password, "with ", user.password, "and result is: ", bcrypt.compareSync(req.body.password, user.password))
            req.session.userId = user._id;
            console.log("redirecting to dashboard from login... ", req.session.userId)
            res.redirect("/dashboard");
        }
    })
});

app.get("/dashboard", loginRequired, (req, res) => {
    // because we use the loginRequired middleware, we no longer have to check for session cookies
    // on each request
    res.render("dashboard", {userName: res.locals.user.firstName + ' ' + res.locals.user.lastName}); 
});

app.listen(3000, () => {
    console.log('Running on the port ' + 3000)
});