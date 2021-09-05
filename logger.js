const pino = require("pino");

function logger(name) {
    return pino({
        name: name,
        prettyPrint: { colorize: true, translateTime: "SYS:standard" },
        base: undefined,
        level: process.env.CI ? "silent" : process.env.LOG_LEVEL || "info",
    });
}

module.exports = logger;
