const pool = require("./database");
const Sentry = require("@sentry/node");
const logger = require("../logger")("Pretzel");
const { default: axios } = require("axios");

class Pretzel {
    static activeUser;
    static io;

    constructor(io) {
        Pretzel.io = io;
        io.on("connection", (socket) => {
            socket.on("pretzel.user", (user) => {
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

let called = [];

function playBackNotification() {
    if (!Pretzel.activeUser) {
        setTimeout(playBackNotification, 1000);
        return;
    }
    axios
        .get("https://api.pretzel.tv/playing/twitch/" + Pretzel.activeUser)
        .then((res) => {
            if (res.data.includes("undefined")) {
                logger.debug("Currently no song playing.");
                return;
            }

            let matches = res.data.match(/Now Playing: (.*) by (.*) ->/);
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
        })
        .catch((error) => {
            logger.error({ error: error });
        });
    setTimeout(playBackNotification, 60000);
}

module.exports = { Pretzel };
