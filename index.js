const cors = require("cors");
const io = require("socket.io")(3000, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
});
const tmi = require("tmi.js");
const express = require("express");
const config = require("dotenv").config();
const app = express();
let bot;

entryPoint() // moving setup in a seperate function gives us the ability to wrap it all around ngrok or smth

function entryPoint() {
    bot = tmi.client({
        channels: [process.env.CHANNEL],
        connection: {
            reconnect: true,
        },
        identity: {
            username: process.env.IRC_USER,
            password: process.env.IRC_TOKEN
        }
    });

    bot.connect().then(() => {
        console.log("Connected to IRC");
    }).catch((error) => {
        console.error(error);
    });

    bot.on("chat", (channel, userstate, message, self) => {
        if (self) return;

        io.sockets.emit("chat", userstate, message, self);
    })

    app.listen(3001);
    app.locals.basedir = '/views/';
    app.set('view engine', 'pug');
    app.use("/static", express.static("static"));

    app.get("/overlay/alertbox", (req, res) => {
        res.render("overlays/parts/alertbox.pug");
    });
}