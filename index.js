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

    app.get("/overlay/:overlay", (req, res) => {
        res.render("overlays/parts/"+req.params.overlay);
    });

    if(process.argv.includes("--test")) setTimeout(testAlert, 3000);
}

function testAlert() {
    let alerts = [{name: "BURDEL", message: "This is a moderately long message PogChamp"},
        {name: "Strike", message: "StrikLuv"},
        {name: "VeryLongTwitchUsernameLOL", message: "This is a veray long message testing the wrapping of the alert box even with a long name. Like my username. Lol."}];
    for(i = 0; i < 10; i++) {
        for(j = 0; j < 3; j++) {
            io.sockets.emit("follow", {username: alerts[j].name}, alerts[j].message, false);
        }
    }
}