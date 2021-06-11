const pool = require("../server/database");

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
    {
        function: executeDonation,
        text: ["donations", "donation", "spende", "spenden"],
    },
    {
        function: executeWatchtime,
        text: ["watchtime", "wt"],
    },
    {
        function: executeFollowage,
        text: ["followage", "fa"],
    },
    {
        function: executeAccountAge,
        text: ["accountage"],
    },
    {
        function: executeUptime,
        text: ["uptime", "livetime"],
    },
    {
        function: executeCommands,
        text: ["befele", "commands"],
    },
    {
        function: executeLurk,
        text: ["lurk"],
    },
    {
        function: executeQuotes,
        text: ["quote"],
    },
    // MOD:
    {
        function: executeShoutout,
        text: ["shoutout", "so"],
    },
    /*     {
        function: executePermit,
        text: ["permit"],
    },
    {
        function: executeSetGame,
        text: ["setgame", "sg"],
    },
    {
        function: executeSetTitle,
        text: ["settitle", "st"],
    }, */
    {
        function: executeCounters,
        text: ["counter"],
    },
    //STREAMER:
];

let channel = process.env.CHANNEL;

function checkCommand(bot, message, userstate) {
    const re = /^!(\S*)\s?(.*)?$/m;
    const matches = re.exec(message);
    if (matches == null) {
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
    if (!ranks.includes(requiredLevel)) {
        return false;
    }
    for (let i in ranks) {
        if (userstate.badges.hasOwnProperty(ranks[i])) {
            return true;
        }
        if (ranks[i] === requiredLevel) {
            return false;
        }
    }
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

function executeDonation(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
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
    let recipient = findRecipient(matches, userstate);

    let followage = " ";
    bot.say(channel, followage);
}

function executeAccountAge(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);

    let accountage = " ";
    bot.say(channel, accountage);
}

function executeUptime(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    //UPTIME MISSING
    let upTime = " ";
    let message = "@" + recipient + ", CodeRoria ist seit " + upTime + " live.";
    bot.say(channel, message);
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

function executeLurk(bot, userstate) {
    let recipient = userstate.username;
    let lurk = recipient + " ist jetzt im Lurk";
    bot.say(channel, lurk);
}

function executeQuotes(bot, matches, userstate) {
    let requiredLevel = "moderator";
    let newQuote = "";
    if (matches.shift() === "add" && hasPermission(userstate, requiredLevel)) {
        newQuote = matches.join(" ");
        pool.query(
            "INSERT INTO quotes (quote) VALUES (?);",
            newQuote,
            (error) => {
                if (error) {
                    console.error(error);
                    return;
                }
                bot.say(channel, 'Neues Zitat hinzugefügt: "' + newQuote + '"');
            }
        );
        return;
    }
    pool.query(
        "SELECT * FROM quotes ORDER BY RAND() LIMIT 1;",
        (error, dbres) => {
            if (error) {
                console.error(error);
                return;
            }
            if (dbres.length == 0) {
                bot.say(channel, "Es gibt derzeit keine Zitate :(");
                return;
            }
            bot.say(channel, dbres[0].quote);
        }
    );
}

//------------------------ MOD -------------------------

function executeShoutout(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (hasPermission(userstate, requiredLevel)) {
        if (!matches.length > 0) {
            bot.say(channel, "kein channel angegeben.");
            return;
        }
        let shoutout =
            "Hey! Gib @" +
            matches[0] +
            " doch einen Follow! Der letzte Stream was" +
            " "; //GAME MISSING
        bot.say(channel, shoutout);
    }
}

function executeCounters(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (!hasPermission(userstate, requiredLevel)) {
        return;
    }
    if (matches[0] === "add") {
        if (matches[1] == null) {
            bot.say(channel, "Kein Name angegeben.");
            return;
        }
        pool.query(
            "INSERT INTO counter (name) VALUES (?);",
            matches[1].toLowerCase(),
            (error) => {
                if (error) {
                    if (error.code === "ER_DUP_KEY") {
                        bot.say(
                            channel,
                            `Counter existiert bereits, nutze !counter ${matches[1]} + zum hochzählen`
                        );
                        return;
                    }
                    console.error(error);
                    return;
                }
                bot.say(channel, "Neuer Counter: " + matches[0]);
            }
        );
    } else {
        pool.query(
            "SELECT * FROM counter WHERE name = ?;",
            matches[0].toLowerCase(),
            (error, result) => {
                if (error) {
                    console.error(error);
                    return;
                }

                if (result.length == 0) {
                    bot.say(
                        channel,
                        "Es gibt keinen Counter mit dem Namen " +
                            matches[0] +
                            ". Erstelle einen mit !counter add [name]"
                    );
                    return;
                }
                if (matches[1] == null) {
                    bot.say(
                        channel,
                        "der Counter " +
                            matches[0] +
                            " hat den Wert " +
                            result[0].count
                    );
                    return;
                }
                let points = result[0].count;
                const re = /([+-])(\d*)/;
                let groups = re.exec(matches[1]);
                if (groups[1] == "+") {
                    if (groups[2].length > 0) {
                        points += parseInt(groups[2]);
                    } else {
                        points += 1;
                    }
                }
                if (groups[1] == "-") {
                    if (groups[2].length > 0) {
                        points -= parseInt(groups[2]);
                    } else {
                        points -= 1;
                    }
                }
                pool.query(
                    "UPDATE counter SET count = ? WHERE name = ?;",
                    [points, matches[0].toLowerCase()],
                    (error) => {
                        if (error) {
                            console.error(error);
                            return;
                        }
                        bot.say(
                            channel,
                            "Der Counter " +
                                matches[0] +
                                " wurde aktualisiert und ist nun auf dem Wert " +
                                points
                        );
                    }
                );
            }
        );
    }
}

//---------------------- Streamer ----------------------

module.exports = {
    checkCommand: checkCommand,
    hasPermission: hasPermission,
};
