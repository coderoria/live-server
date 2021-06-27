const cors = require("cors");
const config = require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const cookie = require("cookie");
const tmi = require("tmi.js");
const pool = require("./server/database");
const auth = require("./server/auth");
const eventSub = require("./server/eventsub");
const spotify = require("./server/spotify");
const filters = require("./bot/filters");
const commands = require("./bot/commands");

let bot;

console.log("Hosted on " + process.env.HOST);
entryPoint();

function entryPoint() {
    pool.query(
        "CREATE TABLE IF NOT EXISTS `admins` ( `user_id` INT NOT NULL , `username` VARCHAR(50) , `access_token` VARCHAR(255) , `refresh_token` VARCHAR(255) , `login_token` VARCHAR(255) , PRIMARY KEY (`user_id`)) ENGINE = InnoDB;",
        (error, dbres) => {
            if (error) console.log(error);
            if (dbres.warningCount == 0) {
                auth.authSystem((success) => {
                    if (!success) return;
                    auth.addUser(process.env.CHANNEL, (success) => {
                        if (!success) {
                            console.error(
                                "Could not add " +
                                    process.env.CHANNEL +
                                    " as invited user."
                            );
                            return;
                        }
                        console.log(
                            process.env.CHANNEL + " added as invited user."
                        );
                    });
                });
            }
        }
    );

    pool.query(
        "CREATE TABLE IF NOT EXISTS `quotes` (`id` MEDIUMINT NOT NULL AUTO_INCREMENT, `quote` VARCHAR(255) NOT NULL, PRIMARY KEY(`id`));",
        (error) => {
            if (error) {
                console.log(error);
            }
        }
    );

    pool.query(
        "CREATE TABLE IF NOT EXISTS `counter` (`name` VARCHAR(50) NOT NULL, `count` MEDIUMINT NOT NULL DEFAULT 0, PRIMARY KEY(`name`));",
        (error) => {
            if (error) {
                console.log(error);
            }
        }
    );

    pool.query(
        "CREATE TABLE IF NOT EXISTS `spotify` (`id` VARCHAR(255) NOT NULL, `access_token` VARCHAR(255) NOT NULL, `refresh_token` VARCHAR(255) NOT NULL, `twitch_id` INT NOT NULL, PRIMARY KEY(`id`), FOREIGN KEY(`twitch_id`) REFERENCES `admins`(`user_id`));",
        (error) => {
            if (error) {
                console.log(error);
            }
        }
    );

    bot = tmi.client({
        channels: [process.env.CHANNEL],
        connection: {
            reconnect: true,
        },
        identity: {
            username: process.env.IRC_USER,
            password: process.env.IRC_TOKEN,
        },
    });

    bot.connect()
        .then(() => {
            console.log("Connected to IRC");
        })
        .catch((error) => {
            console.error(error);
        });

    bot.on("message", (channel, userstate, message, self) => {
        if (self) return;

        if (!filters.checkMessage(bot, message, userstate)) {
            commands.checkCommand(bot, message, userstate);
        }
    });

    bot.on("subscription", (channel, username, method, message, userstate) => {
        io.sockets.emit("sub", username, message);
    });

    bot.on("cheer", (channel, userstate, message) => {
        io.sockets.emit(
            "cheer",
            userstate.username,
            userstate.bits + "x " + message
        );
    });

    server.listen(3001);
    app.locals.basedir = "/views/";
    app.set("view engine", "pug");
    app.use(require("cookie-parser")());
    app.use(express.json());
    app.use("/static", express.static("static"));

    app.get("/overlay/:overlay", (req, res) => {
        res.render("overlays/parts/" + req.params.overlay);
    });

    app.use(auth.router);
    app.use(eventSub.router);
    app.use(spotify.router);
    eventSub.setIO(io);
    spotify.setIO(io);

    app.get("/", (req, res) => {
        if (req.cookies.token == undefined) {
            res.redirect("/auth/twitch");
            return;
        }
        auth.checkTwitchAuth(req.cookies.token, (success, username) => {
            if (!success) {
                res.redirect("/auth/twitch");
                return;
            }
            res.render("dashboard/home", {
                title: "Home",
                username: username,
            });
        });
    });

    app.get("/dock", (req, res) => {
        if (req.cookies.token == undefined) {
            res.redirect("/auth/twitch");
            return;
        }
        auth.checkTwitchAuth(req.cookies.token, (success, username) => {
            if (!success) {
                res.redirect("/auth/twitch");
                return;
            }
            spotify
                .getAvailableUsernames()
                .then((usernames) => {
                    res.render("dashboard/dock", {
                        title: "Dock",
                        username: username,
                        spotify: usernames,
                    });
                })
                .catch(() => {
                    res.sendStatus(500);
                });
        });
    });

    io.use((socket, next) => {
        let cookies = cookie.parse(socket.handshake.headers.cookie);
        if (!cookies.hasOwnProperty("token")) {
            return next(new Error("Unauthorized"));
        }
        auth.checkTwitchAuth(cookies.token, (auth) => {
            if (!auth) {
                return next(new Error("Unauthorized"));
            }
            next();
        });
    });

    if (process.argv.includes("--test")) setTimeout(testEvents, 3000);
}

function testEvents() {
    let alerts = [
        {
            name: "BURDEL",
            message: "This is a moderately long message PogChamp",
        },
        { name: "Strike", message: "StrikLuv" },
        {
            name: "VeryLongTwitchUsernameLOL",
            message:
                "This is a veray long message testing the wrapping of the alert box even with a long name. Like my username. Lol.",
        },
    ];
    for (j = 0; j < 3; j++) {
        io.sockets.emit("follow", alerts[j].name, alerts[j].message, false);
    }
    /* io.sockets.emit(
        "playback",
        "https://i.scdn.co/image/107819f5dc557d5d0a4b216781c6ec1b2f3c5ab2",
        "Rival, VAALEA, Glitchedout",
        "Intoxicated By Youth (Glitchedout Remix)"
    ); */
    eventSub.createSubs();
}

module.exports = {
    pool: pool,
};
