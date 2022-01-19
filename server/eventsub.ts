let express = require("express");
export let router = express.Router();
const axios = require("axios");
const mysql = require("mysql");
import crypto from "crypto";
import { Request, Response } from "express";
import { Server } from "socket.io";
import getLogger from "../logger";
const auth = require("./auth");
const pool = require("./database");
const Sentry = require("@sentry/node");
const logger = getLogger("EventSub");

let receivedIds: string[] = [];
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
let io: Server;

router.get("/eventsub", (req: Request, res: Response) => {});

router.post("/eventsub", (req: Request, res: Response) => {
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
        let requestId: string = req.header(
            "Twitch-Eventsub-Message-Id"
        ) as string;
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

export function createSubs() {
    deleteAllEventSubs()
        .then(() => {
            auth.getSystemAuth((access_token: string) => {
                auth.getUserIdByName(process.env.CHANNEL, (user_id: number) => {
                    wantedSubs.forEach((type) => {
                        let data: any = {
                            type: type,
                            version: 1,
                            condition: {},
                            transport: {
                                method: "webhook",
                                callback: process.env.HOST + "/eventsub",
                                secret: process.env.TWITCH_EVENTSUB_SECRET,
                            },
                        };
                        if (type === "channel.raid") {
                            data.condition.to_broadcaster_user_id = user_id;
                        } else {
                            data.condition.broadcaster_user_id = user_id;
                        }
                        axios
                            .post(
                                "https://api.twitch.tv/helix/eventsub/subscriptions",
                                data,
                                {
                                    headers: {
                                        "Client-Id":
                                            process.env.TWITCH_CLIENT_ID,
                                        Authorization: "Bearer " + access_token,
                                    },
                                }
                            )
                            .then(() => {
                                logger.debug(
                                    { type: type },
                                    "Registered EventSub"
                                );
                            })
                            .catch((error: object) => {
                                Sentry.captureException(error);
                                logger.error(
                                    { error: error, type: type },
                                    "Failed to register EventSub!"
                                );
                                return;
                            });
                    });
                });
            });
        })
        .catch(() => {
            logger.error("Could not create EventSubs!");
        });
}

function getEventSubs(callback: Function) {
    auth.authSystem(() => {
        auth.getSystemAuth((access_token: string) => {
            axios
                .get("https://api.twitch.tv/helix/eventsub/subscriptions", {
                    headers: {
                        "Client-Id": process.env.TWITCH_CLIENT_ID,
                        Authorization: "Bearer " + access_token,
                    },
                })
                .then((res: { data: { data: string } }) => {
                    callback(res.data.data);
                });
        });
    });
}

function deleteEventSub(id: number) {
    return new Promise<void>((resolve, reject) => {
        auth.authSystem(() => {
            auth.getSystemAuth((access_token: string) => {
                axios
                    .delete(
                        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`,
                        {
                            headers: {
                                "Client-Id": process.env.TWITCH_CLIENT_ID,
                                Authorization: "Bearer " + access_token,
                            },
                        }
                    )
                    .then(() => {
                        logger.debug({ id: id }, "Deleted EventSub");
                        resolve();
                    })
                    .catch(() => {
                        reject();
                    });
            });
        });
    });
}

function deleteAllEventSubs() {
    return new Promise<void>((resolve, reject) => {
        getEventSubs((subs: Array<any>) => {
            logger.debug(subs, "Deleting eventsubs");
            Promise.all(
                subs.map((element) => {
                    return deleteEventSub(element.id);
                })
            )
                .then(() => {
                    resolve();
                })
                .catch(() => {
                    reject();
                });
        });
    });
}

export function setIO(socket: Server) {
    io = socket;
}

function checkSignature(req: Request) {
    let hmac = crypto.createHmac(
        "sha256",
        process.env.TWITCH_EVENTSUB_SECRET as string
    );
    let messageId: string | undefined = req.header(
        "Twitch-Eventsub-Message-Id"
    );
    let messageTime: string | undefined = req.header(
        "Twitch-Eventsub-Message-Timestamp"
    );

    if (messageId == undefined || messageTime == undefined) {
        return false;
    }
    hmac.update(messageId + messageTime + JSON.stringify(req.body));

    let signature = hmac.digest("hex");
    let expected_header = "sha256=" + signature;

    return expected_header === req.header("Twitch-Eventsub-Message-Signature");
}
