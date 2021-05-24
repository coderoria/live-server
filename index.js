const cors = require("cors");
const config = require("dotenv").config();
const io = require("socket.io")(3000, {
    cors: {
        origin: process.env.HOST,
        methods: ["GET", "POST"]
    }
});
const tmi = require("tmi.js");
const express = require("express");
const app = express();
const mysql = require("mysql");
var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
const auth = require("./server/auth");

let bot;

console.log("Hosted on " + process.env.HOST);
entryPoint();

function entryPoint() {
    pool.query("CREATE TABLE IF NOT EXISTS `admins` ( `user_id` INT NOT NULL , `username` VARCHAR(50) , `access_token` VARCHAR(255) , `refresh_token` VARCHAR(255) , `login_token` VARCHAR(255) , PRIMARY KEY (`user_id`)) ENGINE = InnoDB;", (error, dbres) => {
        if (error) console.log(error);
        if (dbres.warningCount == 0) {
            auth.authSystem(success => {
                if (!success) return;
                auth.addUser(process.env.CHANNEL, success => {
                    if (!success) {
                        console.error("Could not add " + process.env.CHANNEL + " as invited user.");
                        return;
                    }
                    console.log(process.env.CHANNEL + " added as invited user.");
                });
            });
        }
    });

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
    app.use(require("cookie-parser")());
    app.use("/static", express.static("static"));

    app.get("/overlay/:overlay", (req, res) => {
        res.render("overlays/parts/" + req.params.overlay);
    });

    app.use(auth.router);

    app.get("/", (req, res) => {
        if(req.cookies.token == undefined) {
            res.redirect("/auth/twitch");
            return;
        }
        auth.checkTwitchAuth(req.cookies.token, success => {
            if(!success) {
                res.redirect("/auth/twitch");
                return;
            }
            res.render("dashboard/home");
        });
    });

    if (process.argv.includes("--test")) setTimeout(testEvents, 3000);
}

function testEvents() {
    let alerts = [{ name: "BURDEL", message: "This is a moderately long message PogChamp" },
    { name: "Strike", message: "StrikLuv" },
    { name: "VeryLongTwitchUsernameLOL", message: "This is a veray long message testing the wrapping of the alert box even with a long name. Like my username. Lol." }];
    for (j = 0; j < 3; j++) {
        io.sockets.emit("follow", { username: alerts[j].name }, alerts[j].message, false);
    }
    io.sockets.emit("playback", "https://i.scdn.co/image/107819f5dc557d5d0a4b216781c6ec1b2f3c5ab2", "Rival, VAALEA, Glitchedout", "Intoxicated By Youth (Glitchedout Remix)");
}