const i18n = require("i18n");

i18n.configure({
    locales: ["de", "en"],
    directory: path.join(__dirname, "/locales"),
});

module.exports = i18n;
