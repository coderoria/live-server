let violations = {};

setInterval(()=>{
    for (let i in violations){
        if (Date.now() - violations[i].timestamp < 2700000){
            continue;
        }
        delete violations[i];
    }
}, 300000);

function checkMessage(bot, message, userstate) {
    let checks = {
        "checkCaps": {
            "function": checkCaps,
            "points": 4,
            "reason": "writing in caps"
        },
        "checkSpamLetters": {
            "function": checkSpamLetters,
            "points": 10,
            "reason": "using prohibited characters"
        },
        "checkLinks": {
            "function": checkLinks,
            "points": 1,
            "reason": "posting links"
        },
        "checkEmotes":{
            "function": checkEmotes,
            "points": 2,
            "reason": "spaming emotes"
        } 
    };
    for (let i in checks) {
        if (!checks[i].function(message, userstate)) {
            continue;
        }
        let points = 0;
        let multiple = false;
        if (violations.hasOwnProperty(userstate.username)) {
            points = violations[userstate.username].points
            multiple = true;
        }
        points += checks[i].points;
        violations[userstate.username] = {
            "timestamp": Date.now(),
            "points": points,
            "reason": checks[i].reason,
            "multiple": multiple
        };
    }
    if (!violations.hasOwnProperty(userstate.username)) {
        return;
    }
    let channel = process.env.CHANNEL;
    let multipleActions = "";

    if (violations[userstate.username].multiple) {
        multipleActions = "(Multiple violations!)";
    }
    let replyMessage = "@" + userstate["display-name"] + ", Please stop " +
        violations[userstate.username].reason + "!" + multipleActions;

    let points = violations[userstate.username].points;

    if (points < 8) {
        bot.deletemessage(channel, userstate.id);
        bot.say(channel, replyMessage + " (warning)");
    }
    if (points >= 8 && points < 20) {
        bot.timeout(channel, userstate.username, points * points + 40 * points - 324);
        bot.say(channel, replyMessage);
    }
    if (points >= 20) {
        bot.ban(channel, userstate.username);
        bot.say(channel, "@" + userstate["display-name"] + ", enough is enough! you've been " +
            violations[userstate.username].reason + " too much now!" + multipleActions);
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
    if (userstate.mod || userstate.subscriber) {
        return false;
    }
    const re = /([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    let matches = re.exec(message);
    if (matches == null) {
        return false;
    }
    return matches[1] != "clips.twitch.tv";
}

function checkEmotes(message, userstate){
    if (userstate.mod) {
        return false;
    }
    let emotes = 0;
    for (let i in userstate.emotes){
        emotes = emotes + userstate.emotes[i].length;
    }
    return emotes > 10;
}