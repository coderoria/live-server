const pino = require("pino");

export default function getLogger(name: string) {
  return pino({
    name: name,
    prettyPrint: { colorize: true, translateTime: "SYS:standard" },
    base: undefined,
    level: process.env.CI ? "silent" : process.env.LOG_LEVEL || "info",
  });
}
