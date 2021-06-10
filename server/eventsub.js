let express = require("express");
let router = express.Router();
const axios = require("axios");
const mysql = require("mysql");
const crypto = require("crypto");
const auth = require("./auth");
const pool = require("./database");

let io;

router.get("/eventsub", (req, res) => {});

router.post("/eventsub", (req, res) => {
    if (
        req.header("Twitch-Eventsub-Message-Type") ===
        "webhook_callback_verification"
    ) {
        if (!checkSignature(req)) {
            res.sendStatus(403);
            return;
        }
        res.send(req.body.challenge);
        return;
    }
    if (req.header("Twitch-Eventsub-Message-Type") === "notification") {
        if (!checkSignature(req)) {
            res.sendStatus(403);
            return;
        }
        io.sockets.emit("follow", req.body.event.user_name, null, false);
        console.log(req.body.event.user_name);
        res.sendStatus(200);
        return;
    }
    res.sendStatus(400);
});

function createSubs() {
    deleteAllEventSubs();
    auth.authSystem(() => {
        auth.getSystemAuth((access_token) => {
            pool.query(
                "SELECT `user_id` FROM `admins` WHERE `username`=?;",
                process.env.CHANNEL,
                (error, res) => {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    let user_id = res[0].user_id;

                    axios
                        .post(
                            "https://api.twitch.tv/helix/eventsub/subscriptions",
                            {
                                type: "channel.follow",
                                version: 1,
                                condition: {
                                    broadcaster_user_id: "101572475",
                                },
                                transport: {
                                    method: "webhook",
                                    callback: process.env.HOST + "/eventsub",
                                    secret: process.env.TWITCH_EVENTSUB_SECRET,
                                },
                            },
                            {
                                headers: {
                                    "Client-Id": process.env.TWITCH_CLIENT_ID,
                                    Authorization: "Bearer " + access_token,
                                },
                            }
                        )
                        .catch((error) => {
                            return;
                        });
                }
            );
        });
    });
}

function getEventSubs(callback) {
    auth.authSystem(() => {
        auth.getSystemAuth((access_token) => {
            axios
                .get("https://api.twitch.tv/helix/eventsub/subscriptions", {
                    headers: {
                        "Client-Id": process.env.TWITCH_CLIENT_ID,
                        Authorization: "Bearer " + access_token,
                    },
                })
                .then((res) => {
                    callback(res.data.data);
                });
        });
    });
}

function deleteEventSub(id) {
    auth.authSystem(() => {
        auth.getSystemAuth((access_token) => {
            axios.delete(
                `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`,
                {
                    headers: {
                        "Client-Id": process.env.TWITCH_CLIENT_ID,
                        Authorization: "Bearer " + access_token,
                    },
                }
            );
        });
    });
}

function deleteAllEventSubs() {
    getEventSubs((subs) => {
        subs.forEach((element) => {
            deleteEventSub(element.id);
        });
    });
}

function setIO(socket) {
    io = socket;
}

function checkSignature(req) {
    let hmac = crypto.createHmac("sha256", process.env.TWITCH_EVENTSUB_SECRET);
    hmac.update(
        req.header("Twitch-Eventsub-Message-Id") +
            req.header("Twitch-Eventsub-Message-Timestamp") +
            JSON.stringify(req.body)
    );

    let signature = hmac.digest("hex");
    let expected_header = "sha256=" + signature;

    return expected_header === req.header("Twitch-Eventsub-Message-Signature");
}

module.exports = {
    router: router,
    createSubs: createSubs,
    setIO: setIO,
    deleteAllEventSubs: deleteAllEventSubs,
};
