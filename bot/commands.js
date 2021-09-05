const i18n = require("../i18n");
const pool = require("../server/database");
const filters = require("./filters");
const logger = require("../logger")("Commands");
const twitch = require("../server/twitchApi");
const moment = require("moment");

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
        text: ["github", "git"],
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
        text: ["commands", "befehle"],
    },
    {
        function: executeLurk,
        text: ["lurk"],
    },
    {
        function: executeQuotes,
        text: ["quote"],
    },
    // SUBSCRIBER:
    {
        function: executeClip,
        text: ["clip"],
    },
    // MOD:
    {
        function: executeShoutout,
        text: ["shoutout", "so"],
    },
    {
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
    },
    {
        function: executeCounters,
        text: ["counter"],
    },
    //STREAMER:
    {
        function: executeLanguage,
        text: ["language", "lang"],
    },
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
            logger.info(
                {
                    userstate: userstate,
                    message: message,
                    function: commands[i].function.name,
                    args: matches[0] ? matches[0].split(" ") : [],
                },
                "Recognized command"
            );
            commands[i].function(
                bot,
                matches[0] ? matches[0].split(" ") : [],
                userstate
            );
        }
    }
}

function findRecipient(matches, userstate) {
    let recipient = "@" + userstate["display-name"];
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
    if (userstate.badges == null) {
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
    let discord = __("commands.discord", recipient);
    bot.say(channel, discord);
}

function executeTwitter(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let twitter = __("commands.twitter", recipient);
    bot.say(channel, twitter);
}

function executeGitHub(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let gitHub = __("commands.github", recipient);
    bot.say(channel, gitHub);
}

function executeCredit(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let credit = __("commands.credit", recipient);
    bot.say(channel, credit);
}

function executeDonation(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let donation = __("commands.donation", recipient); //LINK MISSING
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
    twitch.getActiveStreamByName(process.env.CHANNEL, (data) => {
        if (data == null) {
            bot.say(
                channel,
                __("commands.uptime.noStream", recipient, channel)
            );
            return;
        }
        let diff = moment.duration(moment().diff(moment(data.started_at)));
        let uptime =
            diff.hours() +
            "h" +
            diff.minutes() +
            "min" +
            diff.seconds() +
            "sec";
        let message = __("commands.uptime.message", recipient, channel, uptime);
        bot.say(channel, message);
    });
}

function executeCommands(bot, matches, userstate) {
    let recipient = findRecipient(matches, userstate);
    let command = "";
    let commandStrings = [];
    for (let i in commands) {
        commandStrings.push(commands[i].text[0]);
    }
    command = commandStrings.join(", ");
    let message = __("commands.commands", recipient, command);
    bot.say(channel, message);
}

function executeLurk(bot, matches, userstate) {
    let recipient = userstate.username;
    let lurk = __("commands.lurk", recipient);
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
                    logger.error({ error: error });
                    return;
                }
                bot.say(channel, __("commands.quotes.newAdded", newQuote));
            }
        );
        return;
    }
    pool.query(
        "SELECT * FROM quotes ORDER BY RAND() LIMIT 1;",
        (error, dbres) => {
            if (error) {
                logger.error({ error: error });
                return;
            }
            if (dbres.length == 0) {
                bot.say(channel, __("commands.quotes.noQuotes"));
                return;
            }
            bot.say(channel, '"' + dbres[0].quote + '"');
        }
    );
}
//--------------------- Subcribers ---------------------

function executeClip(bot, matches, userstate) {
    let requiredLevel = "subscriber";
    if (!hasPermission(userstate, requiredLevel)) {
        return;
    }
    twitch.createClip(process.env.CHANNEL, (clip_url) => {
        if (clip_url == null) {
            bot.say(channel, __("commands.clip.notCreated"));
            return;
        }
        if (clip_url === "") {
            bot.say(channel, __("commands.clip.notFound"));
            return;
        }
        bot.say(channel, __("commands.clip.success", clip_url));
    });
}

//------------------------ MOD -------------------------

function executeShoutout(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (hasPermission(userstate, requiredLevel)) {
        if (!matches.length > 0) {
            bot.say(channel, __("commands.shoutout.noChannel"));
            return;
        }
        twitch.getLastPlayedName(
            matches[0].replace("@", ""),
            (lastGameName) => {
                if (lastGameName === "") {
                    bot.say(
                        channel,
                        __("commands.shoutout.noGame", matches[0])
                    );
                    return;
                }
                if (lastGameName === null) {
                    bot.say(channel, __("commands.shoutout.noUser"));
                    return;
                }
                let shoutout = __(
                    "commands.shoutout.message",
                    matches[0],
                    lastGameName
                );
                bot.say(channel, shoutout);
            }
        );
    }
}

function executePermit(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (!hasPermission(userstate, requiredLevel)) {
        return;
    }
    if (matches.length === 0) {
        let permitError = __("commands.permit.noNameProvided");
        bot.say(channel, permitError);
        return;
    }
    filters.addPermit(matches[0].replaceAll("@", ""));
    let permitMessage = __("commands.permit.message", matches[0]);
    bot.say(channel, permitMessage);
}

function executeSetGame(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (!hasPermission(userstate, requiredLevel)) {
        return;
    }
    if (matches.length == 0) {
        bot.say(
            channel,
            __("commands.setGame.noGame", "@" + userstate["display-name"])
        );
        return;
    }
    twitch.setGame(matches.join(" "), (success, gameName) => {
        if (!success) {
            bot.say(
                channel,
                __("commands.setGame.failed", "@" + userstate["display-name"])
            );
            return;
        }
        bot.say(
            channel,
            __(
                "commands.setGame.success",
                "@" + userstate["display-name"],
                gameName
            )
        );
    });
}

function executeSetTitle(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (!hasPermission(userstate, requiredLevel)) {
        return;
    }
    if (matches.length == 0) {
        bot.say(
            channel,
            __("commands.setTitle.noTitle", "@" + userstate["display-name"])
        );
        return;
    }
    twitch.setTitle(matches.join(" "), (success) => {
        if (!success) {
            bot.say(
                channel,
                __("commands.failed", "@" + userstate["display-name"])
            );
            return;
        }
        bot.say(
            channel,
            __(
                "commands.setTitle.success",
                "@" + userstate["display-name"],
                matches.join(" ")
            )
        );
    });
}

function executeCounters(bot, matches, userstate) {
    let requiredLevel = "moderator";
    if (matches[0] === "add") {
        if (!hasPermission(userstate, requiredLevel)) {
            return;
        }
        if (matches[1] == null) {
            bot.say(
                channel,
                __("commands.counters.noNameProvided"),
                "@" + userstate["display-name"]
            );
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
                            __(
                                "commands.counters.addDuplicate",
                                "@" + userstate["display-name"],
                                matches[1]
                            )
                        );
                        return;
                    }
                    logger.error({ error: error });
                    return;
                }
                bot.say(
                    channel,
                    __(
                        "commands.counters.addedNew",
                        "@" + userstate["display-name"],
                        matches[1]
                    )
                );
            }
        );
    } else if (matches[0] === "delete") {
        if (!hasPermission(userstate, requiredLevel)) {
            return;
        }
        if (matches[1] == null) {
            bot.say(
                channel,
                __(
                    "commands.counters.noNameProvided",
                    "@" + userstate["display-name"]
                )
            );
            return;
        }
        pool.query(
            "DELETE FROM counter WHERE name = ?;",
            matches[1].toLowerCase(),
            (error, result) => {
                if (error) {
                    logger.error({ error: error });
                    return;
                }
                if (result.affectedRows === 0) {
                    bot.say(
                        channel,
                        __(
                            "commands.counters.doesNotExist",
                            "@" + userstate["display-name"],
                            matches[1]
                        )
                    );
                    return;
                }
                bot.say(
                    channel,
                    __(
                        "commands.counters.deleted",
                        "@" + userstate["display-name"],
                        matches[1]
                    )
                );
            }
        );
    } else {
        if (matches.length == 0) {
            bot.say(
                channel,
                __(
                    "commands.counters.noNameProvided",
                    "@" + userstate["display-name"]
                )
            );
            return;
        }
        pool.query(
            "SELECT * FROM counter WHERE name = ?;",
            matches[0].toLowerCase(),
            (error, result) => {
                if (error) {
                    logger.error({ error: error });
                    return;
                }

                if (result.length == 0) {
                    bot.say(
                        channel,
                        __(
                            "commands.counters.doesNotExist",
                            "@" + userstate["display-name"],
                            matches[0]
                        )
                    );
                    return;
                }
                if (matches[1] == null) {
                    bot.say(
                        channel,
                        __(
                            "commands.counters.showCount",
                            "@" + userstate["display-name"],
                            matches[0],
                            result[0].count
                        )
                    );
                    return;
                }
                if (!hasPermission(userstate, requiredLevel)) {
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
                            logger.error({ error: error });
                            return;
                        }
                        bot.say(
                            channel,
                            __(
                                "commands.counters.updated",
                                "@" + userstate["display-name"],
                                matches[0],
                                points
                            )
                        );
                    }
                );
            }
        );
    }
}

//---------------------- Streamer ----------------------

function executeLanguage(bot, matches, userstate) {
    if (!hasPermission(userstate, "broadcaster")) {
        return;
    }
    let recipient = "@" + userstate["display-name"];
    if (matches.length == 0) {
        bot.say(channel, __("commands.language.noLangGiven", recipient));
        return;
    }
    i18n.setLocale(matches[0]);
    bot.say(channel, __("commands.language.message", recipient));
}

module.exports = {
    checkCommand: checkCommand,
    hasPermission: hasPermission,
};
