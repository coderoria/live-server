const i18n = require("i18n");

i18n.configure({
    locales: ["de", "en"],
    directory: "./locales",
    objectNotation: true,
    register: global,
    autoReload: true,
});

module.exports = i18n;
