const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/nodeAuthTest', {useNewUrlParser: true});


const app = express();

const User = mongoose.model("User", new mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
}));

app.set("view engine", "pug");

app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {

    let user = new User(req.body);

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
    res.render("login");
});

app.post("/login", (req, res) => {
    User.findOne({email: req.body.email}, (err, user) => {
        if(err || !user || req.body.password !== user.password) {
            return res.render("login", {error: "Incorrect email or password"});
        } else {
            res.redirect("/dashboard");
        }
    })
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.listen(3000, () => {
    console.log('Running on the port ' + 3000)
});