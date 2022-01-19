import { Request, Response } from "express";
import { Server } from "socket.io";

const { default: axios } = require("axios");
const express = require("express");
import { pool } from "./database";
const qs = require("querystring");
import * as auth from "./auth";
import getLogger from "../logger";
const logger = getLogger("Spotify");
const Sentry = require("@sentry/node");
let router = express.Router();
let io: Server;
let usedId: number;

interface currentlyPlaying {
    data: {
        is_playing: boolean;
        item: {
            artists: Array<{ name: string }>;
            name: string;
            duration_ms: number;
            album: {
                images: Array<{ url: string }>;
            };
        };
        progress_ms: number;
    };
}

playBackNotification();

function setIO(socket: Server) {
    io = socket;

    io.on("connection", (socket) => {
        socket.on("spotify.user", (user) => {
            pool.query(
                `SELECT id FROM spotify JOIN admins ON admins.user_id=spotify.twitch_id WHERE admins.username=?;`,
                user,
                (error, dbres) => {
                    if (error) {
                        Sentry.captureException(error);
                        logger.error({ error: error });
                        return;
                    }
                    if (dbres.length == 0) {
                        return;
                    }
                    usedId = dbres[0].id;
                    logger.info(
                        { twitchUserName: user, spotifyId: dbres[0].id },
                        "Active user changed"
                    );
                    io.sockets.emit("spotify.user", user);
                }
            );
        });
    });
}

router.get("/auth/spotify", (req: Request, res: Response) => {
    auth.checkTwitchAuth(req.cookies.token, (success: boolean) => {
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
                            Buffer.from(
                                process.env.SPOTIFY_CLIENT_ID +
                                    ":" +
                                    process.env.SPOTIFY_CLIENT_SECRET,
                                "base64"
                            ),
                    },
                }
            )
            .then(
                (coderes: {
                    data: { access_token: string; refresh_token: string };
                }) => {
                    let access_token = coderes.data.access_token;
                    let refresh_token = coderes.data.refresh_token;

                    axios
                        .get("https://api.spotify.com/v1/me", {
                            headers: {
                                Authorization: "Bearer " + access_token,
                            },
                        })
                        .then((idres: { data: { id: number } }) => {
                            auth.getUserIdByToken(req.cookies.token)
                                .then((user_id: number) => {
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
                                                Sentry.captureException(error);
                                                logger.error({ error: error });
                                                res.sendStatus(500);
                                                return;
                                            }
                                            res.send("Spotify connected");
                                            logger.info(
                                                {
                                                    twitchUserId: user_id,
                                                    spotifyId: idres.data.id,
                                                },
                                                "Successfully connected spotify"
                                            );
                                        }
                                    );
                                })
                                .catch((error: { response: string }) => {
                                    Sentry.captureException(error);
                                    logger.error({ error: error.response });
                                    res.sendStatus(500);
                                });
                        })
                        .catch((error: { response: string }) => {
                            Sentry.captureException(error);
                            logger.error({ error: error.response });
                            res.sendStatus(500);
                            return;
                        });
                }
            )
            .catch((error: { response: string }) => {
                logger.warn(error.response, "User supplied invalid OAuth code");
                res.sendStatus(403);
                return;
            });
    });
});

function checkAuth(id: number) {
    return new Promise<void>((resolve, reject) => {
        pool.query(
            "SELECT access_token FROM spotify WHERE id=?;",
            id,
            (error, res) => {
                if (error) {
                    Sentry.captureException(error);
                    logger.error({ error: error });
                    return;
                }
                axios
                    .get("https://api.spotify.com/v1/me", {
                        headers: {
                            Authorization: "Bearer " + res[0].access_token,
                        },
                    })
                    .then((data: object) => {
                        resolve();
                    })
                    .catch((error: object) => {
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

function refreshAuth(id: number) {
    logger.debug("Refreshing access for " + id);
    return new Promise<void>((resolve, reject) => {
        pool.query(
            "SELECT `refresh_token` FROM `spotify` WHERE `id`=?;",
            id,
            (error, dbres) => {
                if (error) {
                    Sentry.captureException(error);
                    logger.error({ error: error });
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
                    .then(
                        (res: {
                            data: {
                                access_token: string;
                                refresh_token: string;
                            };
                        }) => {
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
                                        logger.error({ error: error });
                                        reject();
                                        return;
                                    }
                                    logger.debug("Renewal successful.");
                                    resolve();
                                }
                            );
                        }
                    )
                    .catch((error: object) => {
                        Sentry.captureException(error);
                        logger.error({ error: error });
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
                    logger.error({ error: error });
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
                    .then((player: currentlyPlaying) => {
                        if (!player.data.is_playing) {
                            setTimeout(playBackNotification, 60000);
                            logger.debug("Currently no song playing.");
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

                        if (progress < duration / 4) {
                            setTimeout(
                                playBackNotification,
                                duration / 4 - progress + 1000
                            );
                            logger.debug(
                                "progress < duration / 4. Rescheduling in " +
                                    (duration / 4 - progress + 1000)
                            );
                            return;
                        } else if (
                            progress >= duration / 4 &&
                            progress < duration / 1.25
                        ) {
                            setTimeout(
                                playBackNotification,
                                duration / 1.25 - progress + 1000
                            );
                            logger.debug(
                                "In the middle. Rescheduling in " +
                                    (duration / 1.25 - progress + 1000)
                            );
                        } else {
                            setTimeout(
                                playBackNotification,
                                duration - progress + 5000
                            );
                        }
                        logger.info(
                            { title: titleLine, artists: artistLine },
                            "Emitting playback alert"
                        );
                        io.sockets.emit(
                            "playback",
                            player.data.item.album.images[1].url,
                            artistLine,
                            titleLine
                        );
                    })
                    .catch((error: object) => {
                        logger.error({ error: error });
                        setTimeout(playBackNotification, 60000);
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
                    logger.error({ error: error });
                    reject(error);
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
