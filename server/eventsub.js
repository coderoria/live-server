let express = require("express");
let router = express.Router();
const axios = require("axios");
const mysql = require("mysql");
const crypto = require("crypto");
const auth = require("./auth");
const pool = require("./database");
const logger = require("../logger")("EventSub");

let receivedIds = [];
let wantedSubs = [
    "channel.follow",
    "channel.subscribe",
    "channel.subscription.gift",
    "channel.subscription.message",
    "channel.cheer",
    "channel.raid",
    "channel.poll.begin",
    "channel.poll.end",
    "channel.prediction.begin",
    "channel.prediction.lock",
    "channel.prediction.end",
    "stream.online",
    "stream.offline",
];
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
        if (receivedIds.length >= 50) {
            receivedIds.shift();
        }
        let requestId = req.header("Twitch-Eventsub-Message-Id");
        if (receivedIds.includes(requestId)) {
            res.sendStatus(200);
            logger.debug(
                { requestId: requestId },
                `Notification was a duplicate`
            );
            return;
        }
        receivedIds.push(requestId);

        io.sockets.emit(req.body.subscription.type, req.body.event);
        logger.info(
            {
                type: req.body.subscription.type,
                requestId: requestId,
                event: req.body.event,
            },
            `Event received`
        );
        res.sendStatus(200);
        return;
    }
    res.sendStatus(400);
});

function createSubs() {
    deleteAllEventSubs();
    setTimeout(() => {
        auth.getSystemAuth((access_token) => {
            auth.getUserIdByName(process.env.CHANNEL, (user_id) => {
                wantedSubs.forEach((type) => {
                    logger.debug({ type: type }, "Registering EventSub");
                    axios
                        .post(
                            "https://api.twitch.tv/helix/eventsub/subscriptions",
                            {
                                type: type,
                                version: 1,
                                condition: {
                                    broadcaster_user_id: user_id,
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
                            logger.error(
                                { error: error, type: type },
                                "Failed to register EventSub!"
                            );
                            return;
                        });
                });
            });
        });
    }, 3000);
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
        logger.debug(subs, "Deleting eventsubs");
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
