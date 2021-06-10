const assert = require("assert");
const sinon = require("sinon");
const commands = require("../bot/commands");

let bot = { say: function () {} };
let botMock;
let userstate = {
    username: "testuser",
    "display-name": "TestUser",
    emotes: {},
    badges: { moderator: 1, subscriber: 1 },
    id: 1234,
};

beforeEach(function () {
    botMock = sinon.mock(bot);
});

afterEach(function () {
    botMock.verify();
});

describe("Commands", function () {
    it("Not a command", function () {
        commands.checkCommand(bot, "kein befehl", userstate);
    });

    it("Command with recipient", function () {
        botMock
            .expects("say")
            .once()
            .alwaysCalledWith(undefined, sinon.match(/^@TestUser.*/));
        commands.checkCommand(bot, "!discord @TestUser", userstate);
    });

    describe("Permission checks (user has mod+sub)", function () {
        it("Subscriber required", function () {
            assert(commands.hasPermission(userstate, "subscriber"));
        });

        it("VIP required", function () {
            assert(commands.hasPermission(userstate, "vip"));
        });

        it("Broadcaster required", function () {
            assert(!commands.hasPermission(userstate, "broadcaster"));
        });

        it("Invalid permissions required", function () {
            assert(!commands.hasPermission(userstate, "notarank"));
        });
    });

    describe("Execute", function () {
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

        it("Followage command", function () {
            botMock.expects("say").once();
            commands.checkCommand(bot, "!followage", userstate);
        });

        it("Accountage command", function () {
            botMock.expects("say").once();
            commands.checkCommand(bot, "!accountage", userstate);
        });

        it("Commands command", function () {
            botMock.expects("say").once();
            commands.checkCommand(bot, "!commands", userstate);
        });

        it("Shoutout command", function () {
            botMock
                .expects("say")
                .once()
                .neverCalledWith(undefined, "kein channel angegeben.");
            commands.checkCommand(bot, "!shoutout testuser", userstate);
        });

        it("Shoutout command (invalid)", function () {
            botMock
                .expects("say")
                .once()
                .alwaysCalledWith(undefined, "kein channel angegeben.");
            commands.checkCommand(bot, "!shoutout", userstate);
        });
    });
});
