const i18n = require("../i18n");
const logger = require("../logger")("Filters");

let violations = {};
let permits = [];

setInterval(() => {
    for (let i in violations) {
        if (Date.now() - violations[i].timestamp < 2700000) {
            continue;
        }
        delete violations[i];
    }
}, 300000);

function checkMessage(bot, message, userstate) {
    let checks = {
        checkCaps: {
            function: checkCaps,
            points: 3,
            reason: __("filters.caps"),
        },
        checkSpamLetters: {
            function: checkSpamLetters,
            points: 10,
            reason: __("filters.spamLetters"),
        },
        checkLinks: {
            function: checkLinks,
            points: 1,
            reason: __("filters.links"),
        },
        checkEmotes: {
            function: checkEmotes,
            points: 2,
            reason: __("filters.emotes"),
        },
    };
    let violated = false;
    for (let i in checks) {
        if (!checks[i].function(message, userstate)) {
            continue;
        }
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
    let channel = process.env.CHANNEL;
    let multipleActions = "";

    if (violations[userstate.username].multiple) {
        multipleActions = __("filters.multiple");
    }

    let points = violations[userstate.username].points;
    let currentPoints = __("filters.currentPoints", points);

    if (points < 8) {
        bot.deletemessage(channel, userstate.id).catch((error) => {
            logger.error(error);
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
    }
    bot.say(
        channel,
        __(
            "filters.warning",
            "@" + userstate["display-name"],
            violations[userstate.username].reason
        ) +
            currentPoints +
            multipleActions
    );
    return true;
}

function checkCaps(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /[A-ZÄÜÖ]/g;
    let caps = (message.match(re) || []).length;

    return (
        caps / message.replaceAll(/\s/g, "").length > 0.8 && message.length > 10
    );
}

function checkSpamLetters(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /%CC%/g;
    return re.test(encodeURIComponent(message));
}

function checkLinks(message, userstate) {
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

function checkEmotes(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    let emotes = 0;
    for (let i in userstate.emotes) {
        emotes = emotes + userstate.emotes[i].length;
    }
    return emotes > 10;
}

function addPermit(username) {
    permits.push({
        username: username.toLowerCase(),
        until: new Date().getTime() + 60000,
    });
}

function checkPermit(username) {
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

module.exports = {
    checkMessage: checkMessage,
    addPermit: addPermit,
};
