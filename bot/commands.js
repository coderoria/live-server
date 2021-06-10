let commands = [
    //USER:
    {
        function: executeDiscord,
        text: ["discord", "dc"],
    },
    {
        function: executeTwitter,
        text: ["twitter"],
    },
    {
        function: executeGitHub,
        text: ["git", "github"],
    },
    {
        function: executeCredit,
        text: ["credit", "overlay", "icons"],
    },
    /*{
        function: executeDonation,
        text: ["donations", "donation", "spende", "spenden"],
    },*/
    {
        function: executeWatchtime,
        text: ["watchtime", "wt"],
    },
    {
        function: executeFollowage,
        text: ["followage", "fa"],
    },
    {
        function: executeAccoutAge,
        text: ["accoutage"],
    },
    /* {
        function: executeUptime,
        text: ["uptime", "livetime"],
    }, */
    {
        function: executeCommands,
        text: ["befele", "commands"],
    },
    /* {
        function: executeLurk,
        text: ["lurk"],
    }, */
    /* {
        function: executeQuotes,
        text: ["quote"],
    }, */
    // MOD:
    {
        function: executeShoutout,
        text: ["shoutout", "so"],
    },
    /* {
        function: executePermit,
        text: ["permit"],
    }, */
    /* {
        function: executeSetGame,
        text: ["setgame", "sg"],
    }, */
    /* {
        function: executeSetTitle,
        text: ["settitle", "st"],
    }, */
    /* {
        function: executeCounters,
        text: ["counter"],
    }, */
    //STREAMER:
];

let channel = process.env.CHANNEL;

function checkCommand(bot, message, userstate) {
    const re = /^!(\S*)\s?(.*)?$/m;
    const matches = re.exec(message);
    if (matches.length == 0) {
        return;
    }
    matches.shift();
    let command = matches.shift();
    for (let i in commands) {
        if (commands[i].text.includes(command.toLowerCase())) {
            commands[i].function(
                bot,
                matches[0] ? matches[0].split(" ") : [],
                userstate
            );
        }
    }
}

function findRecipient(matches, userstate) {
    let recipient = userstate["display-name"];
    if (matches.length > 0) {
        recipient = matches[0];
    }
    return recipient;
}

function hasPermission(userstate, requiredLevel) {
    let ranks = ["broadcaster", "moderator", "vip", "subscriber"];
    for (let i in ranks) {
        if (userstate.badges.hasOwnProperty(ranks[i])) {
            return true;
        }
        if (ranks[i] === requiredLevel) {
            return false;
        }
    }
    return false;
}

//------------------------ USER ------------------------

function executeDiscord(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let discord =
        recipient + ", hier ist unser Discord: https://coderoria.com/discord";
    bot.say(channel, discord);
}

function executeTwitter(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let twitter =
        recipient +
        ", hier ist unser Twitter account: https://coderoria.com/twitter";
    bot.say(channel, twitter);
}

function executeGitHub(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let gitHub =
        recipient +
        ", hier sind alle unsere Projekte gesammelt: https://coderoria.com/github";
    bot.say(channel, gitHub);
}

function executeCredit(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let credit =
        recipient +
        ", Unser Overlay basiert auf dem Icon-Pack BeautyLine: https://www.gnome-look.org/p/1425426/";
    bot.say(channel, credit);
}

function executeWatchtime(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);

    let watchtime = " ";
    bot.say(channel, watchtime);
}

function executeFollowage(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);

    let followage = " ";
    bot.say(channel, followage);
}

function executeAccoutAge(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);

    let accountage = " ";
    bot.say(channel, accountage);
}

function executeCommands(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let command = "";
    for (let i in commands) {
        for (let j in commands[i].text) {
            command += commands[i].text[j];
            command += ", ";
        }
    }
    let message =
        "@" +
        recipient +
        ", Das sind alle Commands auf diesem Channel: " +
        command;
    bot.say(channel, message);
}

//------------------------ MOD -------------------------

function executeShoutout(bot, matches, userstate) {
    //MOD ONLY
    if (!matches.length > 0) {
        bot.say(channel, "kein channel angegeben.");
    }
    let shoutout =
        "Hey! Gib @" +
        matches[0] +
        " doch einen Follow! Der letzte Stream was" +
        " ";
    bot.say(channel, shoutout);
}
//---------------------- Streamer ----------------------

module.exports = {
    checkCommand: checkCommand,
};
