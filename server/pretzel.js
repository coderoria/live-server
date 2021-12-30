const pool = require("./database");
const Sentry = require("@sentry/node");
const logger = require("../logger")("Pretzel");
const { default: axios } = require("axios");

class Pretzel {
    static activeUser;

    constructor(io) {
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
                    }
                );
            });
        });

        playBackNotification();
    }
}

function playBackNotification() {
    if (!Pretzel.activeUser) {
        setTimeout(playBackNotification, 1000);
        return;
    }
    axios
        .get("https://api.pretzel.tv/playing/twitch/" + Pretzel.activeUser)
        .then((res) => {
            logger.info({ data: res }, "Pretzel queried succesfully.");
        })
        .catch((error) => {
            logger.error({ error: error });
        });
    setTimeout(playBackNotification, 60000);
}

module.exports = { Pretzel };
