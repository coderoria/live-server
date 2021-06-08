let violations = {};

function checkMessage(bot, message, userstate) {
    let checks = {
        "checkCaps": {
            "function": checkCaps,
            "points": 2
        },
        "checkSpamLetters": {
            "function": checkSpamLetters,
            "points": 4
        },
        "checkLinks": {
            "function": checkLinks,
            "points": 1
        }
    };
    for (let i in checks) {
        if (!checks[i].function(message, userstate)) {
            continue;
        }
        let points = 0;
        if (violations.hasOwnProperty(userstate.username)) {
            points = violations[userstate.username].points
        }
        points += checks[i].points;
        violations[userstate.username] = {"timestamp" : Date.now(), "points" : points};
    }
}

function checkCaps(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /[A-Z]/g;
    let caps = (message.match(re) || []).length;
    return caps / message.length > 0.8;
}

function checkSpamLetters(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /%CC%/g;
    return re.test(encodeURIComponent(message));
}

function checkLinks(message, userstate) {
    if (userstate.mod) {
        return false;
    }
    const re = /([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    let matches = re.exec(message);
    if (matches == null) {
        return false;
    }
    return matches[1] != "clips.twitch.tv";
}