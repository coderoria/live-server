let express = require("express");
let router = express.Router();
const axios = require("axios");
const mysql = require("mysql");
const crypto = require("crypto");
const pool = require("./database");
const logger = require("../logger")("Auth");

router.get("/auth/twitch", (req, res) => {
    if (req.query.code == undefined) {
        let url = `https://id.twitch.tv/oauth2/authorize`;
        url += `?client_id=${process.env.TWITCH_CLIENT_ID}`;
        url += `&redirect_uri=${encodeURIComponent(
            process.env.HOST + "/auth/twitch"
        )}`;
        url += `&response_type=code`;
        url += `&scope=bits:read channel:edit:commercial channel:manage:broadcast `;
        url += `channel:manage:polls channel:manage:predictions channel:manage:redemptions `;
        url += `channel:manage:videos channel:read:hype_train channel:read:polls `;
        url += `channel:read:predictions channel:read:redemptions channel:read:subscriptions `;
        url += `clips:edit moderation:read` + `&force_verify=true`;
        res.redirect(url);
        return;
    }

    axios
        .post(
            `https://id.twitch.tv/oauth2/token` +
                `?client_id=${process.env.TWITCH_CLIENT_ID}` +
                `&client_secret=${process.env.TWITCH_CLIENT_SECRET}` +
                `&code=${req.query.code}` +
                `&grant_type=authorization_code` +
                `&redirect_uri=${encodeURI(process.env.HOST + "/auth/twitch")}`
        )
        .then((coderes) => {
            let data = coderes.data;
            let access_token = data.access_token;
            let refresh_token = data.refresh_token;

            //get username of user and validate
            axios
                .get("https://id.twitch.tv/oauth2/validate", {
                    headers: {
                        Authorization: "OAuth " + access_token,
                    },
                })
                .then((coderes) => {
                    let data = coderes.data;
                    let username = data.login;
                    let user_id = data.user_id;
                    let login_token = crypto.randomBytes(32).toString("hex");

                    pool.query(
                        "UPDATE `admins` SET `username`=?, " +
                            "`access_token`=?, `refresh_token`=?, `login_token`=? WHERE `user_id`=?;",
                        [
                            username,
                            access_token,
                            refresh_token,
                            login_token,
                            user_id,
                        ],
                        (error, dbres) => {
                            if (error) {
                                logger.error(error);
                                res.sendStatus(500);
                                return;
                            }
                            if (dbres.affectedRows == 0) {
                                res.status(401);
                                res.send(
                                    "You're not invited for registration."
                                );
                                return;
                            }
                            res.cookie("token", login_token, {
                                expires: new Date(Date.now() + 604800000), //7 days
                            });
                            res.redirect("/");
                        }
                    );
                })
                .catch((error) => {
                    res.sendStatus(400);
                });
        })
        .catch((error) => {
            res.sendStatus(400);
        });
});

/*
Adds a user to the admins table.
*/
function addUser(name, callback) {
    pool.query(
        "SELECT `access_token` FROM `admins` WHERE `user_id`=-1;",
        (error, dbres) => {
            if (error) {
                logger.error(error);
                callback(false);
                return;
            }
            let access_token = dbres[0].access_token;

            axios
                .get(`https://api.twitch.tv/helix/users` + `?login=${name}`, {
                    headers: {
                        Authorization: "Bearer " + access_token,
                        "Client-Id": process.env.TWITCH_CLIENT_ID,
                    },
                })
                .then((res) => {
                    let user_id = res.data.data[0].id;
                    pool.query(
                        "INSERT INTO `admins` (`user_id`, `username`) VALUES (?,?);",
                        [user_id, name],
                        (error) => {
                            if (error) {
                                logger.error(error);
                                callback(false);
                                return;
                            }
                            callback(true);
                        }
                    );
                })
                .catch((error) => {
                    logger.error(error);
                    callback(false);
                });
        }
    );
}

/*
Adds the System to the admins table. user_id will be -1 
and we authenticate with twitch to get an app token via
OAuth Client Credentials Flow
*/
function authSystem(callback) {
    axios
        .post(
            `https://id.twitch.tv/oauth2/token` +
                `?client_id=${process.env.TWITCH_CLIENT_ID}` +
                `&client_secret=${process.env.TWITCH_CLIENT_SECRET}` +
                `&grant_type=client_credentials`
        )
        .then((res) => {
            let access_token = res.data.access_token;

            pool.query(
                "REPLACE INTO `admins` (`user_id`, `access_token`) VALUES(?,?);",
                [-1, access_token],
                (error, dbres) => {
                    if (error) {
                        logger.error(error);
                        callback(false);
                        return;
                    }
                    callback(true);
                }
            );
        })
        .catch((error) => {
            logger.error("Could not get a System token from Twitch:");
            logger.error(error);
            callback(false);
        });
}

function getSystemAuth(callback) {
    pool.query(
        "SELECT `access_token` FROM `admins` WHERE `user_id`='-1';",
        (error, res) => {
            if (error) {
                callback(null);
                return;
            }
            axios
                .get("https://id.twitch.tv/oauth2/validate", {
                    headers: {
                        Authorization: "Bearer " + res[0].access_token,
                    },
                })
                .then((coderes) => {
                    callback(res[0].access_token);
                    return;
                })
                .catch((error) => {
                    authSystem((success) => {
                        if (success) {
                            getSystemAuth(callback);
                            return;
                        }
                        callback(null);
                    });
                });
        }
    );
}

/*
Checks that the login_token supplied is valid and checks the user authentication
against Twitch. If the authentication is invalid, it calls refreshTwitchAuth.
If this function calls your callback with true,
you can be sure that 1) the user is an admin and 2) the access_token
in the database is valid and can be used for requests
*/
function checkTwitchAuth(token, callback) {
    if (token == null) {
        callback(false);
        return;
    }
    pool.query(
        "SELECT * FROM `admins` WHERE `login_token`=?;",
        token,
        (error, dbres) => {
            if (error) {
                logger.error(error);
                return;
            }
            if (dbres.length == 0) {
                callback(false);
                return;
            }
            axios
                .get("https://id.twitch.tv/oauth2/validate", {
                    headers: {
                        Authorization: "OAuth " + dbres[0].access_token,
                    },
                })
                .then((data) => {
                    callback(true, dbres[0].username);
                })
                .catch((error) => {
                    refreshTwitchAuth(dbres[0].user_id, (success) => {
                        callback(success);
                    });
                });
        }
    );
}

function refreshTwitchAuth(user_id, callback) {
    pool.query(
        "SELECT `refresh_token` FROM `admins` WHERE `user_id`=?;",
        user_id,
        (error, dbres) => {
            let refresh_token = dbres[0].refresh_token;

            axios
                .post(
                    `https://id.twitch.tv/oauth2/token` +
                        `?grant_type=refresh_token` +
                        `&refresh_token=${refresh_token}` +
                        `&client_id=${process.env.TWITCH_CLIENT_ID}` +
                        `&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
                )
                .then((data) => {
                    let access_token = data.data.access_token;
                    let refresh_token = data.data.refresh_token;

                    pool.query(
                        "UPDATE `admins` SET `access_token`=?, `refresh_token`=? WHERE `user_id`=?;",
                        [access_token, refresh_token, user_id],
                        (error) => {
                            if (error) {
                                logger.error(error);
                                callback(false);
                                return;
                            }
                            callback(true);
                        }
                    );
                })
                .catch((error) => {
                    callback(false);
                });
        }
    );
}

function getUserIdByName(username, callback) {
    getSystemAuth((token) => {
        if (token == null) {
            callback(null);
            return;
        }
        axios
            .get(`https://api.twitch.tv/helix/users?login=${username}`, {
                headers: {
                    Authorization: "Bearer " + token,
                    "Client-Id": process.env.TWITCH_CLIENT_ID,
                },
            })
            .then((res) => {
                callback(res.data.data[0].id);
                return;
            })
            .catch((error) => {
                logger.error(error);
                callback(null);
            });
    });
}

function getUserIdByToken(token) {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT `user_id` FROM `admins` WHERE `login_token`=?;",
            token,
            (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (res.length == 0) {
                    reject();
                    return;
                }
                resolve(res[0].user_id);
            }
        );
    });
}

module.exports = {
    router: router,
    authSystem: authSystem,
    addUser: addUser,
    checkTwitchAuth: checkTwitchAuth,
    getSystemAuth: getSystemAuth,
    getUserIdByName: getUserIdByName,
    getUserIdByToken: getUserIdByToken,
};
