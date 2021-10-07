const { default: axios } = require("axios");
const logger = require("../logger")("TwitchApi");
const auth = require("./auth");
const Sentry = require("@sentry/node");

function setTitle(title, callback) {
    auth.getAccessTokenByName(process.env.CHANNEL, (access_token) => {
        if (access_token == null) {
            callback(false);
            return;
        }
        auth.getUserIdByName(process.env.CHANNEL, (userId) => {
            axios
                .patch(
                    `https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`,
                    { title: title },
                    {
                        headers: {
                            Authorization: "Bearer " + access_token,
                            "Client-Id": process.env.TWITCH_CLIENT_ID,
                            "Content-Type": "application/json",
                        },
                    }
                )
                .catch((error) => {
                    logger.error(
                        { error: error },
                        "Changing title was not successful"
                    );
                    Sentry.captureException(error);
                    callback(false);
                    return;
                })
                .then((res) => {
                    callback(true);
                });
        });
    });
}

function setGame(search, callback) {
    auth.getAccessTokenByName(process.env.CHANNEL, (access_token) => {
        axios
            .get(
                `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(
                    search
                )}&first=1`,
                {
                    headers: {
                        Authorization: "Bearer " + access_token,
                        "Client-Id": process.env.TWITCH_CLIENT_ID,
                    },
                }
            )
            .catch((error) => {
                logger.error(
                    { error: error },
                    "Searching for Category failed."
                );
                Sentry.captureException(error);
                callback(false);
                return;
            })
            .then((searchResult) => {
                logger.debug(searchResult.data.data, "Found list of games");
                if (searchResult.data.data.length == 0) {
                    callback(false);
                    return;
                }
                let gameId = searchResult.data.data[0].id;
                let gameName = searchResult.data.data[0].name;

                auth.getUserIdByName(process.env.CHANNEL, (userId) => {
                    axios
                        .patch(
                            `https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`,
                            { game_id: gameId },
                            {
                                headers: {
                                    Authorization: "Bearer " + access_token,
                                    "Client-Id": process.env.TWITCH_CLIENT_ID,
                                    "Content-Type": "application/json",
                                },
                            }
                        )
                        .catch((error) => {
                            logger.error(
                                error,
                                "Changing Category was not successful"
                            );
                            Sentry.captureException(error);
                            callback(false);
                            return;
                        })
                        .then((res) => {
                            callback(true, gameName);
                        });
                });
            });
    });
}

function getActiveStreamByName(username, callback) {
    auth.getSystemAuth((access_token) => {
        axios
            .get(
                `https://api.twitch.tv/helix/streams?user_login=${username}&first=1`,
                {
                    headers: {
                        Authorization: "Bearer " + access_token,
                        "Client-Id": process.env.TWITCH_CLIENT_ID,
                    },
                }
            )
            .catch((error) => {
                Sentry.captureException(error);
                logger.error({ error: error }, "Could not get active stream");
                callback(null);
                return;
            })
            .then((result) => {
                if (result.data.data.length == 0) {
                    callback(null);
                    return;
                }
                callback(result.data.data[0]);
            });
    });
}

function getLastPlayedName(username, callback) {
    auth.getSystemAuth((app_access_token) => {
        auth.getUserIdByName(username, (user_Id) => {
            if (!user_Id) {
                callback(user_Id);
                return;
            }
            axios
                .get(
                    `https://api.twitch.tv/helix/channels?broadcaster_id=${user_Id}`,
                    {
                        headers: {
                            Authorization: "Bearer " + app_access_token,
                            "Client-Id": process.env.TWITCH_CLIENT_ID,
                        },
                    }
                )
                .then((result) => {
                    if (!result.data.data[0].game_name) {
                        callback("");
                        return;
                    }
                    callback(result.data.data[0].game_name);
                    return;
                })
                .catch((error) => {
                    Sentry.captureException(error);
                    logger.error({ error: error }, "Could not get last Game");
                    callback(null);
                    return;
                });
        });
    });
}

function createClip(username, callback) {
    auth.getAccessTokenByName(username, (access_token) => {
        auth.getUserIdByName(username, (user_id) => {
            axios
                .post(
                    `https://api.twitch.tv/helix/clips?broadcaster_id=${user_id}`,
                    null,
                    {
                        headers: {
                            Authorization: "Bearer " + access_token,
                            "Client-Id": process.env.TWITCH_CLIENT_ID,
                        },
                    }
                )
                .then((result) => {
                    setTimeout(() => {
                        getCreatedClip(result.data.data[0].id, (clip_link) => {
                            callback(clip_link);
                        });
                    }, 15000);
                })
                .catch((error) => {
                    if (error.response.status === 404) {
                        logger.warn(error, "Tried creating clip while offline");
                        callback(null);
                        return;
                    }
                    Sentry.captureException(error);
                    logger.error({ error: error }, "Could not create clip");
                    callback(null);
                    return;
                });
        });
    });
}

function getCreatedClip(clip_id, callback) {
    auth.getSystemAuth((app_access_token) => {
        axios
            .get(`https://api.twitch.tv/helix/clips?id=${clip_id}`, {
                headers: {
                    Authorization: "Bearer " + app_access_token,
                    "Client-Id": process.env.TWITCH_CLIENT_ID,
                },
            })
            .then((result) => {
                if (result.data.data.length == 0) {
                    callback("");
                    return;
                }
                callback(result.data.data[0].url);
                return;
            })
            .catch((error) => {
                Sentry.captureException(error);
                logger.error({ error: error }, "Could not get clip");
                callback(null);
                return;
            });
    });
}

module.exports = {
    setTitle: setTitle,
    setGame: setGame,
    getActiveStreamByName: getActiveStreamByName,
    getLastPlayedName: getLastPlayedName,
    createClip: createClip,
};
