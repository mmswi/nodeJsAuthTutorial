const express = require("express");

const app = express();

app.set("view engine", "pug");

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.listen(3000);

app.on("listening", () => {
    console.log("server listening on port 3000")
})