import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { Server, Socket } from "socket.io";
const app = express();
const server = require("http").createServer(app);
const io: Server = require("socket.io")(server);
import cookie from "cookie";
import "./i18n";
import * as tmi from "tmi.js";
import getLogger from "./logger";
import { pool } from "./server/database";
import * as auth from "./server/auth";
import * as eventSub from "./server/eventsub";
import * as spotify from "./server/spotify";
import * as filters from "./bot/filters";
import * as commands from "./bot/commands";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
const logger = getLogger("Index");
import Pretzel from "./server/pretzel";

let bot: tmi.Client;

logger.info("Hosted on " + process.env.HOST);

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.SENTRY_DSN ? true : false,
    release: "live-server@" + process.env.npm_package_version,
    tracesSampleRate: 1,
    debug: process.env.LOG_LEVEL === "debug",
    integrations: [new Tracing.Integrations.Mysql()],
});

pool.query(
    "CREATE TABLE IF NOT EXISTS `admins` ( `user_id` INT NOT NULL , `username` VARCHAR(50) , `access_token` VARCHAR(255) , `refresh_token` VARCHAR(255) , `login_token` VARCHAR(255) , PRIMARY KEY (`user_id`)) ENGINE = InnoDB;",
    (error, dbres) => {
        if (error) {
            Sentry.captureException(error);
            logger.error(error);
            return;
        }
        if (dbres.warningCount == 0) {
            auth.authSystem((success: boolean) => {
                if (!success) return;
                auth.addUser(
                    process.env.CHANNEL as string,
                    (success: boolean) => {
                        if (!success) {
                            logger.error(
                                "Could not add " +
                                    process.env.CHANNEL +
                                    " as invited user."
                            );
                            return;
                        }
                        logger.info(
                            process.env.CHANNEL + " added as invited user."
                        );
                    }
                );
            });
        }
    }
);

pool.query(
    "CREATE TABLE IF NOT EXISTS `quotes` (`id` MEDIUMINT NOT NULL AUTO_INCREMENT, `quote` VARCHAR(255) NOT NULL, PRIMARY KEY(`id`));",
    (error) => {
        if (error) {
            Sentry.captureException(error);
            logger.info(error);
        }
    }
);

pool.query(
    "CREATE TABLE IF NOT EXISTS `counter` (`name` VARCHAR(50) NOT NULL, `count` MEDIUMINT NOT NULL DEFAULT 0, PRIMARY KEY(`name`));",
    (error) => {
        if (error) {
            Sentry.captureException(error);
            logger.info(error);
        }
    }
);

pool.query(
    "CREATE TABLE IF NOT EXISTS `spotify` (`id` VARCHAR(255) NOT NULL, `access_token` VARCHAR(255) NOT NULL, `refresh_token` VARCHAR(255) NOT NULL, `twitch_id` INT NOT NULL, PRIMARY KEY(`id`), FOREIGN KEY(`twitch_id`) REFERENCES `admins`(`user_id`));",
    (error) => {
        if (error) {
            Sentry.captureException(error);
            logger.info(error);
        }
    }
);

bot = tmi.client({
    channels: [process.env.CHANNEL as string],
    connection: {
        reconnect: true,
    },
    identity: {
        username: process.env.IRC_USER,
        password: process.env.IRC_TOKEN,
    },
});

bot.connect()
    .then((host) => {
        logger.info(host, "Connected to IRC");
    })
    .catch((error) => {
        Sentry.captureException(error);
        logger.error({ error: error });
    });

bot.on("message", (channel, userstate, message, self) => {
    if (self) return;

    if (!filters.checkMessage(bot, message, userstate)) {
        commands.checkCommand(bot, message, userstate);
    }
});

server.listen(3000);
app.locals.basedir = "/views/";
app.set("view engine", "pug");
app.use(require("cookie-parser")());
app.use(express.json());
app.use("/static", express.static("static"));

app.get("/overlay/:overlay", (req, res) => {
    res.render("overlays/parts/" + req.params.overlay);
});

new Pretzel(io);

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
    auth.checkTwitchAuth(
        req.cookies.token,
        (success: boolean, username: string) => {
            if (!success) {
                res.redirect("/auth/twitch");
                return;
            }
            res.render("dashboard/home", {
                title: "Home",
                username: username,
            });
        }
    );
});

app.get("/dock", (req, res) => {
    if (req.cookies.token == undefined) {
        res.redirect("/auth/twitch");
        return;
    }
    auth.checkTwitchAuth(
        req.cookies.token,
        (success: boolean, username: string) => {
            if (!success) {
                res.redirect("/auth/twitch");
                return;
            }
            spotify
                .getAvailableUsernames()
                .then(async (usernames: string[]) => {
                    let pretzelUsers = await Pretzel.getAllUsers();
                    res.render("dashboard/dock", {
                        title: "Dock",
                        username: username,
                        spotify: usernames,
                        pretzel: pretzelUsers,
                    });
                })
                .catch((error: object) => {
                    Sentry.captureException(error);
                    res.sendStatus(500);
                });
        }
    );
});

io.use((socket: Socket, next: Function) => {
    let cookies = cookie.parse(socket.handshake.headers.cookie as string);
    if (!cookies.hasOwnProperty("token")) {
        return next(new Error("Unauthorized"));
    }
    auth.checkTwitchAuth(cookies.token, (auth: boolean, username: string) => {
        if (!auth) {
            return next(new Error("Unauthorized"));
        }
        logger.debug(
            { id: socket.id },
            `User ${username} authenticated against socket`
        );
        next();
    });
});

io.use((socket: Socket, next: Function) => {
    socket.on("error", (error) => {
        Sentry.captureEvent(error);
        logger.warn(error, "Window reporting error");
    });
    next();
});

if (process.argv.includes("--test")) setTimeout(testEvents, 3000);

function testEvents() {
    io.sockets.on("connect", (socket: Socket) => {
        socket.on("testAlert", (username: string | null) => {
            logger.info("Sending test alert");
            io.sockets.emit("channel.follow", {
                user_name: username ? username : "Strike",
                user_login: username ? username.toLowerCase() : "strike",
            });
        });
    });
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
