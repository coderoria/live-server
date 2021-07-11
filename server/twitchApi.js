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
                    logger.warn(error, "Changing title was not successful");
                    callback(false);
                    return;
                })
                .then((res) => {
                    callback(true);
                });
        });
    });
}

module.exports = {
    setTitle: setTitle,
};
