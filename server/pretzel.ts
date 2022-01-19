import { Server, Socket } from "socket.io";
import getLogger from "../logger";
import { pool } from "./database";
const Sentry = require("@sentry/node");
const logger = getLogger("Pretzel");
const { default: axios } = require("axios");

export default class Pretzel {
    static activeUser: number;
    static io: Server;

    constructor(io: Server) {
        Pretzel.io = io;
        io.on("connection", (socket: Socket) => {
            socket.on("pretzel.user", (user: string) => {
                pool.query(
                    "SELECT user_id FROM admins WHERE username=?;",
                    user,
                    (error, dbres) => {
                        if (error) {
                            Sentry.captureException(error);
                            logger.severe({ error: error });
                            return;
                        }
                        if (dbres.length == 0) {
                            return;
                        }
                        Pretzel.activeUser = dbres[0].user_id;
                        logger.info(
                            { twitchUserName: user },
                            "Active user changed"
                        );
                        io.sockets.emit("pretzel.user", user);
                    }
                );
            });
        });

        playBackNotification();
    }

    static getAllUsers() {
        return new Promise((resolve, reject) => {
            pool.query(
                "SELECT username FROM admins WHERE user_id > 0;",
                (error, dbres) => {
                    if (error) {
                        Sentry.captureException(error);
                        logger.error({ error: error });
                        reject(error);
                        return;
                    }
                    let users = [];
                    for (let i = 0; i < dbres.length; i++) {
                        users.push(dbres[i].username);
                    }
                    resolve(users);
                }
            );
        });
    }
}

let called: string[] = [];

function playBackNotification() {
    if (!Pretzel.activeUser) {
        setTimeout(playBackNotification, 1000);
        return;
    }
    axios
        .get("https://api.pretzel.tv/playing/twitch/" + Pretzel.activeUser)
        .then((res: { data: string }) => {
            if (res.data.includes("undefined")) {
                logger.debug("Currently no song playing.");
                return;
            }

            let matches = res.data.match(/Now Playing: (.*) by (.*) ->/);
            if (matches == undefined) {
                setTimeout(playBackNotification, 30000);
                return;
            }
            let titleLine = matches[1];
            let artistLine = matches[2];

            logger.info({ data: res.data }, "Successfully queried Pretzel");

            if (called.length >= 3) {
                called.shift();
            }
            called.push(titleLine);
            if (
                called.indexOf(titleLine) != called.lastIndexOf(titleLine) &&
                called.lastIndexOf(titleLine) != 1
            ) {
                setTimeout(playBackNotification, 60000);
                return;
            }

            logger.info(
                { title: titleLine, artists: artistLine },
                "Emitting playback alert"
            );
            Pretzel.io.sockets.emit(
                "playback",
                "/static/img/sub.svg",
                artistLine,
                titleLine
            );
            setTimeout(playBackNotification, 60000);
        })
        .catch((error: object) => {
            logger.error({ error: error });
            setTimeout(playBackNotification, 60000);
        });
}
