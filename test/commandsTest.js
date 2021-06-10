const assert = require("assert");
const sinon = require("sinon");
const commands = require("../bot/commands");

let bot = { say: function () {} };
let botMock;
let userstate = {
    username: "testuser",
    "display-name": "TestUser",
    emotes: {},
    mod: false,
    id: 1234,
};

beforeEach(function () {
    botMock = sinon.mock(bot);
});

afterEach(function () {
    botMock.verify();
});

describe("Commands", function () {
    it("Discord command", function () {
        botMock.expects("say").once();
        commands.checkCommand(bot, "!discord", userstate);
    });

    it("Twitter command", function () {
        botMock.expects("say").once();
        commands.checkCommand(bot, "!twitter", userstate);
    });

    it("Github command", function () {
        botMock.expects("say").once();
        commands.checkCommand(bot, "!git", userstate);
    });

    it("Credit command", function () {
        botMock.expects("say").once();
        commands.checkCommand(bot, "!credit", userstate);
    });

    it("Watchtime command", function () {
        botMock.expects("say").once();
        commands.checkCommand(bot, "!watchtime", userstate);
    });
});
