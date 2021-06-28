const pino = require("pino");

function logger(name) {
    return pino({
        name: name,
        prettyPrint: { colorize: true },
        base: undefined,
        level: process.env.LOG_LEVEL || "info",
    });
}

module.exports = logger;
