import * as i18n from "i18n";

i18n.configure({
    locales: ["de", "en"],
    directory: "./locales",
    objectNotation: true,
    register: global,
    autoReload: true,
});
