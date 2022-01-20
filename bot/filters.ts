import * as i18n from "i18n";
import { Client, Userstate } from "tmi.js";
import getLogger from "../logger";
const logger = getLogger("Filters");

let violations: any = {};
let permits: { username: string; until: number }[] = [];

setInterval(() => {
    for (let i in violations) {
        if (Date.now() - violations[i].timestamp < 2700000) {
            continue;
        }
        delete violations[i];
    }
}, 300000);

export function checkMessage(
    bot: Client,
    message: string,
    userstate: Userstate
) {
    let checks = {
        checkCaps: {
            function: checkCaps,
            points: 3,
            reason: i18n.__("filters.caps"),
        },
        checkSpamLetters: {
            function: checkSpamLetters,
            points: 10,
            reason: i18n.__("filters.spamLetters"),
        },
        checkLinks: {
            function: checkLinks,
            points: 1,
            reason: i18n.__("filters.links"),
        },
        checkEmotes: {
            function: checkEmotes,
            points: 2,
            reason: i18n.__("filters.emotes"),
        },
    };
    let violated = false;
    let i: keyof typeof checks;
    for (i in checks) {
        if (!checks[i].function(message, userstate)) {
            continue;
        }
        logger.info(
            {
                user: userstate.username,
                message: message,
                function: checks[i].function.name,
                points: checks[i].points,
            },
            "Filter violation"
        );
        violated = true;
        let points = 0;
        let multiple = false;
        if (violations.hasOwnProperty(userstate.username)) {
            points = violations[userstate.username].points;
            multiple = true;
        }
        points += checks[i].points;
        violations[userstate.username] = {
            timestamp: Date.now(),
            points: points,
            reason: checks[i].reason,
            multiple: multiple,
        };
    }
    if (!violations.hasOwnProperty(userstate.username) || !violated) {
        return false;
    }
    let channel: string = process.env.CHANNEL as string;
    let multipleActions = "";

    if (violations[userstate.username].multiple) {
        multipleActions = i18n.__("filters.multiple");
    }

    let points = violations[userstate.username].points;
    let currentPoints = i18n.__("filters.currentPoints", points);

    if (points < 8) {
        bot.deletemessage(channel, userstate.id as string).catch((error) => {
            logger.error({ error: error });
        });
    }
    if (points >= 8 && points < 20) {
        bot.timeout(
            channel,
            userstate.username,
            points * points + 40 * points - 324
        );
    }
    if (points >= 20) {
        bot.ban(channel, userstate.username);
        return true;
    }
    bot.say(
        channel,
        i18n.__(
            "filters.warning",
            "@" + userstate["display-name"],
            violations[userstate.username].reason
        ) +
            currentPoints +
            multipleActions
    );
    return true;
}

function checkCaps(message: string, userstate: Userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /[A-ZÄÜÖ]/g;
    let caps = (message.match(re) || []).length;

    return (
        caps / message.replaceAll(/\s/g, "").length > 0.8 && message.length > 10
    );
}

function checkSpamLetters(message: string, userstate: Userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /%CC%/g;
    return re.test(encodeURIComponent(message));
}

function checkLinks(message: string, userstate: Userstate) {
    if (checkPermit(userstate.username)) {
        return false;
    }
    if (userstate.mod || userstate.subscriber) {
        return false;
    }
    const re =
        /([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    let matches = re.exec(message);
    if (matches == null) {
        return false;
    }
    return matches[1] != "clips.twitch.tv";
}

function checkEmotes(message: string, userstate: Userstate) {
    if (userstate.mod) {
        return false;
    }
    let emotes = 0;
    for (let i in userstate.emotes) {
        emotes = emotes + userstate.emotes[i].length;
    }
    return emotes > 10;
}

export function addPermit(username: string) {
    permits.push({
        username: username.toLowerCase(),
        until: new Date().getTime() + 60000,
    });
}

function checkPermit(username: string) {
    for (let i in permits) {
        if (permits[i].username === username) {
            if (permits[i].until <= new Date().getTime()) {
                delete permits[i];
                return false;
            }
            return true;
        }
    }
    return false;
}
