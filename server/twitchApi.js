const { default: axios } = require("axios");
const logger = require("../logger")("TwitchApi");
const auth = require("./auth");

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
                    logger.error(error, "Changing title was not successful");
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
                logger.error(error, "Searching for Category failed.");
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
                log.error(error, "Could not get active stream");
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

module.exports = {
    setTitle: setTitle,
    setGame: setGame,
    getActiveStreamByName: getActiveStreamByName,
};
