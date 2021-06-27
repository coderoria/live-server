const { default: axios } = require("axios");
const express = require("express");
const pool = require("./database");
const qs = require("querystring");
const auth = require("./auth");
let router = express.Router();
let io;
let usedId;

playBackNotification();

function setIO(socket) {
    io = socket;

    io.on("connection", (socket) => {
        socket.on("spotify.user", (user, callback) => {
            pool.query(
                `SELECT id FROM spotify JOIN admins ON admins.user_id=spotify.twitch_id WHERE admins.username=?;`,
                user,
                (error, dbres) => {
                    if (error) {
                        console.error(error);
                        callback(false);
                        return;
                    }
                    if (dbres.length == 0) {
                        callback(false);
                        return;
                    }
                    usedId = dbres[0].id;
                    callback(true);
                }
            );
        });
    });
}

router.get("/auth/spotify", (req, res) => {
    auth.checkTwitchAuth(req.cookies.token, (success) => {
        if (!success) {
            res.redirect("/auth/twitch");
            return;
        }
        if (req.query.code == null) {
            var scopes =
                "user-read-private user-read-email user-read-playback-state";
            res.redirect(
                "https://accounts.spotify.com/authorize" +
                    "?response_type=code" +
                    "&client_id=" +
                    process.env.SPOTIFY_CLIENT_ID +
                    (scopes ? "&scope=" + encodeURIComponent(scopes) : "") +
                    "&redirect_uri=" +
                    encodeURIComponent(process.env.HOST + "/auth/spotify")
            );
            return;
        }
        axios
            .post(
                "https://accounts.spotify.com/api/token",
                qs.stringify({
                    grant_type: "authorization_code",
                    code: req.query.code,
                    redirect_uri: process.env.HOST + "/auth/spotify",
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization:
                            "Basic " +
                            btoa(
                                process.env.SPOTIFY_CLIENT_ID +
                                    ":" +
                                    process.env.SPOTIFY_CLIENT_SECRET
                            ),
                    },
                }
            )
            .then((coderes) => {
                let access_token = coderes.data.access_token;
                let refresh_token = coderes.data.refresh_token;

                axios
                    .get("https://api.spotify.com/v1/me", {
                        headers: {
                            Authorization: "Bearer " + access_token,
                        },
                    })
                    .then((idres) => {
                        auth.getUserIdByToken(req.cookies.token)
                            .then((user_id) => {
                                pool.query(
                                    "REPLACE INTO `spotify` VALUES(?,?,?,?);",
                                    [
                                        idres.data.id,
                                        access_token,
                                        refresh_token,
                                        user_id,
                                    ],
                                    (error) => {
                                        if (error) {
                                            console.error(error);
                                            res.sendStatus(500);
                                            return;
                                        }
                                        res.send("Spotify connected");
                                    }
                                );
                            })
                            .catch((error) => {
                                console.error(error);
                                res.sendStatus(500);
                            });
                    })
                    .catch((error) => {
                        console.error(error);
                        res.sendStatus(500);
                        return;
                    });
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
                return;
            });
    });
});

function checkAuth(id) {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT access_token FROM spotify WHERE id=?;",
            id,
            (error, res) => {
                if (error) {
                    console.error(error);
                    return;
                }
                axios
                    .get("https://api.spotify.com/v1/me", {
                        headers: {
                            Authorization: "Bearer " + res[0].access_token,
                        },
                    })
                    .then((data) => {
                        resolve();
                    })
                    .catch((error) => {
                        refreshAuth(id)
                            .then(() => {
                                resolve();
                            })
                            .catch(() => {
                                reject(error);
                            });
                    });
            }
        );
    });
}

function refreshAuth(id) {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT `refresh_token` FROM `spotify` WHERE `id`=?;",
            id,
            (error, dbres) => {
                if (error) {
                    console.error(error);
                    reject();
                    return;
                }
                axios
                    .post(
                        "https://accounts.spotify.com/api/token",
                        qs.stringify({
                            grant_type: "refresh_token",
                            refresh_token: dbres[0].refresh_token,
                        }),
                        {
                            headers: {
                                Authorization:
                                    "Basic " +
                                    btoa(
                                        process.env.SPOTIFY_CLIENT_ID +
                                            ":" +
                                            process.env.SPOTIFY_CLIENT_SECRET
                                    ),
                                "Content-Type":
                                    "application/x-www-form-urlencoded",
                            },
                        }
                    )
                    .then((res) => {
                        pool.query(
                            "UPDATE `spotify` SET `access_token`=?, `refresh_token`=? WHERE `id`=?;",
                            [
                                res.data.access_token,
                                res.data.refresh_token != null
                                    ? res.data.refresh_token
                                    : dbres[0].refresh_token,
                                id,
                            ],
                            (error) => {
                                if (error) {
                                    console.error(error);
                                    reject();
                                    return;
                                }
                                resolve();
                            }
                        );
                    })
                    .catch((error) => {
                        console.error(error);
                        return;
                    });
            }
        );
    });
}

function playBackNotification() {
    if (usedId == null) {
        setTimeout(playBackNotification, 60000);
        return;
    }
    checkAuth(usedId).then(() => {
        pool.query(
            "SELECT access_token FROM spotify WHERE id=?;",
            usedId,
            (error, res) => {
                if (error) {
                    console.error(error);
                    return;
                }
                axios
                    .get(
                        "https://api.spotify.com/v1/me/player/currently-playing",
                        {
                            headers: {
                                Authorization: "Bearer " + res[0].access_token,
                            },
                        }
                    )
                    .then((player) => {
                        if (!player.data.is_playing) {
                            setTimeout(playBackNotification, 60000);
                            return;
                        }
                        let artists = [];
                        for (let artist in player.data.item.artists) {
                            artists.push(player.data.item.artists[artist].name);
                        }
                        let artistLine = artists.join(", ");
                        let titleLine = player.data.item.name;
                        let duration = player.data.item.duration_ms;
                        let progress = player.data.progress_ms;

                        if (progress < duration / 1.25) {
                            setTimeout(
                                playBackNotification,
                                duration / 1.25 - progress + 1000
                            );
                            return;
                        }
                        io.sockets.emit(
                            "playback",
                            player.data.item.album.images[1].url,
                            artistLine,
                            titleLine
                        );
                        setTimeout(
                            playBackNotification,
                            duration - progress + 5000
                        );
                    })
                    .catch((error) => {
                        console.error(error);
                        return;
                    });
            }
        );
    });
}

function getAvailableUsernames() {
    return new Promise((resolve, reject) => {
        pool.query(
            `SELECT username FROM admins JOIN spotify ON spotify.twitch_id=admins.user_id;`,
            (error, res) => {
                if (error) {
                    console.error(error);
                    reject();
                    return;
                }
                let users = [];
                for (let i in res) {
                    users.push(res[i].username);
                }
                resolve(users);
            }
        );
    });
}

module.exports = {
    router: router,
    setIO: setIO,
    getAvailableUsernames: getAvailableUsernames,
};
