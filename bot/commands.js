let commands = [
    //USER:
    {
        "function": executeDiscord,
        "text": ["discord", "dc"]
    },
    {
        "function": executeTwitter,
        "text": ["twitter"]
    },
    {
        "function": executeGitHub,
        "text": ["git", "github"]
    },
    {
        "function": executeCredit,
        "text": ["credit", "overlay", "icons"]
    },
    {
        "funktion": executeDonation,
        "text": ["donations", "donation", "spende", "spenden"]
    },
    {
        "funktion": executeWatchtime,
        "text": ["watchtime", "wt"]
    },
    {
        "funktion": executeFollowage,
        "text": ["followage", "fa"]
    },
    {
        "funktion": executeAccoutAge,
        "text": ["accoutage"]
    },
    {
        "funktion": executeUptime,
        "text": ["uptime", "livetime"]
    },
    {
        "funktion": executeCommands,
        "text": ["befele", "commands"]
    },
    {
        "funktion": executeLurk,
        "text": ["lurk"]
    },
    {
        "funktion": executeQuotes,
        "text": ["quote"]
    },
    // MOD:
    {
        "funktion": executeShoutout,
        "text": ["shoutout", "so"]
    },
    {
        "funktion": executePermit,
        "text": ["permit"]
    },
    {
        "funktion": executeSetGame,
        "text": ["setgame", "sg"]
    },
    {
        "funktion": executeSetTitle,
        "text": ["settitle", "st"]
    },
    {
        "funktion": executeCounters,
        "text": ["counter"]
    }
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
            commands[i].function(bot, matches[0].split(' '), userstate);
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
    findRecipient(matches, userstate);
    let discord = recipient + ", hier ist unser Discord: https://coderoria.com/discord";
    bot.say(channel, discord);
}

function executeTwitter(bot, matches, userstate) {
    findRecipient(matches, userstate);
    let twitter = recipient + ", hier ist unser Twitter account: https://coderoria.com/twitter";
    bot.say(channel, twitter);
}

function executeGitHub(bot, matches, userstate) {
    findRecipient(matches, userstate);
    let gitHub = recipient + ", hier sind alle unsere Projekte gesammelt: https://coderoria.com/github";
    bot.say(channel, gitHub);
}

function executeCredit(bot, matches, userstate) {
    findRecipient(matches, userstate);
    let credit = recipient + ", Unser Overlay basiert auf dem Icon-Pack BeautyLine: https://www.gnome-look.org/p/1425426/";
    bot.say(channel, credit);
}

function executeDonation(bot, matches, userstate) {
    findRecipient(matches, userstate);
    let donation = "@" + recipient + ", hier ist unser Donationlink: "; //LINK MISSING
    bot.say(channel, donation);
}

function executeWatchtime(bot, matches, userstate) {
    findRecipient(matches, userstate);
    //WATCHTIME MISSING
    let watchtime = " ";
    bot.say(channel, watchtime);
}

function executeFollowage(bot, matches, userstate) {
    findRecipient(matches, userstate);
    //FOLLOWAGE MISSING
    let followage = " ";
    bot.say(channel, followage);
}

function executeAccoutAge(bot, matches, userstate) {
    findRecipient(matches, userstate);
    //ACCOUNTAGE MISSING
    let accountage = " ";
    bot.say(channel, accountage);
}

function executeUptime(bot, matches, userstate) {
    findRecipient(matches, userstate);
    //UPTIME MISSING
    let upTime = " "; ""
    let message = "@" + recipient + ", CodeRoria ist seit " + upTime + " live.";
    bot.say(channel, message);
}

function executeCommands(bot, matches, userstate) {
    findRecipient(matches, userstate);
    let command = "";
    for (let i in commands){
        for(let j in commands[i].text) {
            command += commands[i].text[j];
            command += ", ";
        }
    }
    let message = "@" + recipient + ", Das sind alle Commands auf diesem Channel: " + command;
    bot.say(channel, message);
}

function executeLurk(bot, userstate) {
    let recipient = userstate.username;
    let lurk = recipient + " ist jetzt im Lurk";
    bot.say(channel, lurk);
}

function executeQuotes(bot, matches, userstate) {
    let requiredLevel = "mod"
    let newQuote = "";
    if (matches.shift() === "add" && hasPermission(userstate, requiredLevel)){
        for (let i in matches){
            newQuote += matches[i] + " ";
        }
        bot.say(channel, "Neues Zitat hinzugefügt: " + newQuote);
        //DATENBANK
        return;
    }
    let quote = ""; //DATENBANK
    bot.say(channel, quote);
}

//------------------------ MOD -------------------------

function executeShoutout(bot, matches, userstate) {
    let requiredLevel = "mod";
    if (hasPermission(userstate,requiredLevel)){
       if (!matches.length > 0) {
        bot.say(channel, "kein channel angegeben.");
        return;
    }
    let shoutout = "Hey! Gib @" + matches[0] + " doch einen Follow! Der letzte Stream was" + " "; //GAME MISSING
    bot.say(channel, shoutout); 
    }
}
//---------------------- Streamer ----------------------
