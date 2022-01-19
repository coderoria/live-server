import { MysqlError } from "mysql";
import { Client, Userstate } from "tmi.js";
import getLogger from "../logger";
import { pool } from "../server/database";
import * as twitch from "../server/twitchApi";
import * as filters from "../bot/filters";
import moment from "moment";
import Sentry from "@sentry/node";
import * as i18n from "i18n";

const logger = getLogger("Commands");

enum Level {
    broadcaster,
    moderator,
    vip,
    subscriber,
}

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

let channel: string = process.env.CHANNEL as string;

export function checkCommand(
    bot: Client,
    message: string,
    userstate: Userstate
) {
    const re = /^!(\S*)\s?(.*)?$/m;
    const matches = re.exec(message);
    if (matches == null) {
        return;
    }
    matches.shift();
    let command = matches.shift();
    if (command == undefined) {
        return;
    }
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

function findRecipient(matches: string[], userstate: Userstate) {
    let recipient = "@" + userstate["display-name"];
    if (matches.length > 0) {
        recipient = matches[0];
    }
    return recipient;
}

function hasPermission(userstate: Userstate, requiredLevel: Level) {
    if (userstate.badges == null) {
        return false;
    }
    for (let i in Level) {
        if (!isNaN(Number(i))) {
            continue;
        }
        if (userstate.badges.hasOwnProperty(i.toString())) {
            return true;
        }
        if (i == requiredLevel.toString()) {
            return false;
        }
    }
}

//------------------------ USER ------------------------

function executeDiscord(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    let discord = i18n.__("commands.discord", recipient);
    bot.say(channel, discord);
}

function executeTwitter(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    let twitter = i18n.__("commands.twitter", recipient);
    bot.say(channel, twitter);
}

function executeGitHub(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    let gitHub = i18n.__("commands.github", recipient);
    bot.say(channel, gitHub);
}

function executeCredit(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    let credit = i18n.__("commands.credit", recipient);
    bot.say(channel, credit);
}

function executeDonation(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    let donation = i18n.__("commands.donation", recipient); //LINK MISSING
    bot.say(channel, donation);
}

function executeWatchtime(
    bot: Client,
    matches: string[],
    userstate: Userstate
) {
    findRecipient(matches, userstate);
    //WATCHTIME MISSING
    let watchtime = " ";
    bot.say(channel, watchtime);
}

function executeFollowage(
    bot: Client,
    matches: string[],
    userstate: Userstate
) {
    let recipient = findRecipient(matches, userstate);

    let followage = " ";
    bot.say(channel, followage);
}

function executeAccountAge(
    bot: Client,
    matches: string[],
    userstate: Userstate
) {
    let recipient = findRecipient(matches, userstate);

    let accountage = " ";
    bot.say(channel, accountage);
}

function executeUptime(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    twitch.getActiveStreamByName(
        process.env.CHANNEL as string,
        (data: { started_at: string }) => {
            if (data == null) {
                bot.say(
                    channel,
                    i18n.__("commands.uptime.noStream", recipient, channel)
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
            let message = i18n.__(
                "commands.uptime.message",
                recipient,
                channel,
                uptime
            );
            bot.say(channel, message);
        }
    );
}

function executeCommands(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = findRecipient(matches, userstate);
    let command = "";
    let commandStrings = [];
    for (let i in commands) {
        commandStrings.push(commands[i].text[0]);
    }
    command = commandStrings.join(", ");
    let message = i18n.__("commands.commands", recipient, command);
    bot.say(channel, message);
}

function executeLurk(bot: Client, matches: string[], userstate: Userstate) {
    let recipient = userstate.username;
    let lurk = i18n.__("commands.lurk", recipient);
    bot.say(channel, lurk);
}

function executeQuotes(bot: Client, matches: string[], userstate: Userstate) {
    let newQuote = "";
    if (
        matches.shift() === "add" &&
        hasPermission(userstate, Level.moderator)
    ) {
        newQuote = matches.join(" ");
        pool.query(
            "INSERT INTO quotes (quote) VALUES (?);",
            newQuote,
            (error: MysqlError | null) => {
                if (error) {
                    Sentry.captureException(error);
                    logger.error({ error: error });
                    return;
                }
                bot.say(channel, i18n.__("commands.quotes.newAdded", newQuote));
            }
        );
        return;
    }
    pool.query(
        "SELECT * FROM quotes ORDER BY RAND() LIMIT 1;",
        (error: MysqlError, dbres: Array<{ quote: string }>) => {
            if (error) {
                Sentry.captureException(error);
                logger.error({ error: error });
                return;
            }
            if (dbres.length == 0) {
                bot.say(channel, i18n.__("commands.quotes.noQuotes"));
                return;
            }
            bot.say(channel, '"' + dbres[0].quote + '"');
        }
    );
}
//--------------------- Subcribers ---------------------

function executeClip(bot: Client, matches: string[], userstate: Userstate) {
    if (!hasPermission(userstate, Level.subscriber)) {
        return;
    }
    twitch.createClip(process.env.CHANNEL as string, (clip_url: string) => {
        if (clip_url == null) {
            bot.say(channel, i18n.__("commands.clip.notCreated"));
            return;
        }
        if (clip_url === "") {
            bot.say(channel, i18n.__("commands.clip.notFound"));
            return;
        }
        bot.say(channel, i18n.__("commands.clip.success", clip_url));
    });
}

//------------------------ MOD -------------------------

function executeShoutout(bot: Client, matches: string[], userstate: Userstate) {
    if (hasPermission(userstate, Level.moderator)) {
        if (!(matches.length > 0)) {
            bot.say(channel, i18n.__("commands.shoutout.noChannel"));
            return;
        }
        twitch.getLastPlayedName(
            matches[0].replace("@", ""),
            (lastGameName: string) => {
                if (lastGameName === "") {
                    bot.say(
                        channel,
                        i18n.__("commands.shoutout.noGame", matches[0])
                    );
                    return;
                }
                if (lastGameName === null) {
                    bot.say(channel, i18n.__("commands.shoutout.noUser"));
                    return;
                }
                let shoutout = i18n.__("commands.shoutout.message", {
                    name: matches[0].replace("@", ""),
                    game: lastGameName,
                });
                bot.say(channel, shoutout);
            }
        );
    }
}

function executePermit(bot: Client, matches: string[], userstate: Userstate) {
    if (!hasPermission(userstate, Level.moderator)) {
        return;
    }
    if (matches.length === 0) {
        let permitError = i18n.__("commands.permit.noNameProvided");
        bot.say(channel, permitError);
        return;
    }
    filters.addPermit(matches[0].replaceAll("@", ""));
    let permitMessage = i18n.__("commands.permit.message", matches[0]);
    bot.say(channel, permitMessage);
}

function executeSetGame(bot: Client, matches: string[], userstate: Userstate) {
    if (!hasPermission(userstate, Level.moderator)) {
        return;
    }
    if (matches.length == 0) {
        bot.say(
            channel,
            i18n.__("commands.setGame.noGame", "@" + userstate["display-name"])
        );
        return;
    }
    twitch.setGame(matches.join(" "), (success: boolean, gameName: string) => {
        if (!success) {
            bot.say(
                channel,
                i18n.__(
                    "commands.setGame.failed",
                    "@" + userstate["display-name"]
                )
            );
            return;
        }
        bot.say(
            channel,
            i18n.__(
                "commands.setGame.success",
                "@" + userstate["display-name"],
                gameName
            )
        );
    });
}

function executeSetTitle(bot: Client, matches: string[], userstate: Userstate) {
    if (!hasPermission(userstate, Level.moderator)) {
        return;
    }
    if (matches.length == 0) {
        bot.say(
            channel,
            i18n.__(
                "commands.setTitle.noTitle",
                "@" + userstate["display-name"]
            )
        );
        return;
    }
    twitch.setTitle(matches.join(" "), (success: Boolean) => {
        if (!success) {
            bot.say(
                channel,
                i18n.__("commands.failed", "@" + userstate["display-name"])
            );
            return;
        }
        bot.say(
            channel,
            i18n.__(
                "commands.setTitle.success",
                "@" + userstate["display-name"],
                matches.join(" ")
            )
        );
    });
}

function executeCounters(bot: Client, matches: string[], userstate: Userstate) {
    if (matches[0] === "add") {
        if (!hasPermission(userstate, Level.moderator)) {
            return;
        }
        if (matches[1] == null) {
            bot.say(
                channel,
                i18n.__(
                    "commands.counters.noNameProvided",
                    "@" + userstate["display-name"]
                )
            );
            return;
        }
        pool.query(
            "INSERT INTO counter (name) VALUES (?);",
            matches[1].toLowerCase(),
            (error: MysqlError | null) => {
                if (error) {
                    if (error.code === "ER_DUP_KEY") {
                        bot.say(
                            channel,
                            i18n.__(
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
                    i18n.__(
                        "commands.counters.addedNew",
                        "@" + userstate["display-name"],
                        matches[1]
                    )
                );
            }
        );
    } else if (matches[0] === "delete") {
        if (!hasPermission(userstate, Level.moderator)) {
            return;
        }
        if (matches[1] == null) {
            bot.say(
                channel,
                i18n.__(
                    "commands.counters.noNameProvided",
                    "@" + userstate["display-name"]
                )
            );
            return;
        }
        pool.query(
            "DELETE FROM counter WHERE name = ?;",
            matches[1].toLowerCase(),
            (error: MysqlError | null, result: { affectedRows: number }) => {
                if (error) {
                    Sentry.captureException(error);
                    logger.error({ error: error });
                    return;
                }
                if (result.affectedRows === 0) {
                    bot.say(
                        channel,
                        i18n.__(
                            "commands.counters.doesNotExist",
                            "@" + userstate["display-name"],
                            matches[1]
                        )
                    );
                    return;
                }
                bot.say(
                    channel,
                    i18n.__(
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
                i18n.__(
                    "commands.counters.noNameProvided",
                    "@" + userstate["display-name"]
                )
            );
            return;
        }
        pool.query(
            "SELECT * FROM counter WHERE name = ?;",
            matches[0].toLowerCase(),
            (error: MysqlError | null, result: Array<{ count: number }>) => {
                if (error) {
                    Sentry.captureException(error);
                    logger.error({ error: error });
                    return;
                }

                if (result.length == 0) {
                    bot.say(
                        channel,
                        i18n.__(
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
                        i18n.__(
                            "commands.counters.showCount",
                            "@" + userstate["display-name"],
                            matches[0],
                            result[0].count.toString()
                        )
                    );
                    return;
                }
                if (!hasPermission(userstate, Level.moderator)) {
                    return;
                }
                let points = result[0].count;
                const re = /([+-])(\d*)/;
                let groups = re.exec(matches[1]);
                if (groups == null || groups.length < 2) {
                    return;
                }
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
                    (error: MysqlError | null) => {
                        if (error) {
                            Sentry.captureException(error);
                            logger.error({ error: error });
                            return;
                        }
                        bot.say(
                            channel,
                            i18n.__(
                                "commands.counters.updated",
                                "@" + userstate["display-name"],
                                matches[0],
                                points.toString()
                            )
                        );
                    }
                );
            }
        );
    }
}

//---------------------- Streamer ----------------------

function executeLanguage(bot: Client, matches: string[], userstate: Userstate) {
    if (!hasPermission(userstate, Level.moderator)) {
        return;
    }
    let recipient = "@" + userstate["display-name"];
    if (matches.length == 0) {
        bot.say(channel, i18n.__("commands.language.noLangGiven", recipient));
        return;
    }
    i18n.setLocale(matches[0]);
    bot.say(channel, i18n.__("commands.language.message", recipient));
}

module.exports = {
    checkCommand: checkCommand,
    hasPermission: hasPermission,
};
