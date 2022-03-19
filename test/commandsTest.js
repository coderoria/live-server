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
  sinon.restore();
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
    botMock.verify();
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
      botMock.verify();
    });

    it("Twitter command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!twitter", userstate);
      botMock.verify();
    });

    it("Github command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!git", userstate);
      botMock.verify();
    });

    it("Credit command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!credit", userstate);
      botMock.verify();
    });

    it("Watchtime command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!watchtime", userstate);
      botMock.verify();
    });

    it("Followage command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!followage", userstate);
      botMock.verify();
    });

    it("Accountage command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!accountage", userstate);
      botMock.verify();
    });

    it("Commands command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!commands", userstate);
      botMock.verify();
    });

    describe("Shoutout command", function () {
      // shoutout can't work w/o access keys
      it("!shoutout testuser", function () {});

      it("!shoutout", function () {
        botMock
          .expects("say")
          .once()
          .alwaysCalledWith(undefined, "kein channel angegeben.");
        commands.checkCommand(bot, "!shoutout", userstate);
        botMock.verify();
      });
    });

    it("Donation command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!donation", userstate);
      botMock.verify();
    });

    it("Uptime command", function () {
      botMock.expects("say").never();
      // uptime can't work w/o access keys
      commands.checkCommand(bot, "!uptime", userstate);
      botMock.verify();
    });

    it("Lurk command", function () {
      botMock.expects("say").once();
      commands.checkCommand(bot, "!lurk", userstate);
      botMock.verify();
    });

    describe("Quote command", function () {
      let pool = require("../server/database");

      it("Random quote", function () {
        let stub = sinon.stub(pool, "query").yields(null, [{ quote: "Test" }]);
        botMock.expects("say").once().calledWith(undefined, "Test");
        commands.checkCommand(bot, "!quote", userstate);
        botMock.verify();
      });

      it("No quote available", function () {
        let stub = sinon.stub(pool, "query").yields(null, []);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!quote", userstate);
        botMock.verify();
      });

      it("Add new quote", function () {
        let stub = sinon.stub(pool, "query").yields(null);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!quote add hehe lol", userstate);
        assert.strictEqual(stub.lastCall.args[1], "hehe lol");
        botMock.verify();
      });
    });

    describe("Counter command", function () {
      let pool = require("../server/database");
      let stub;

      it("Get counter", function () {
        let stub = sinon
          .stub(pool, "query")
          .yields(null, [{ name: "testcounter", count: 1000 }]);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter", userstate);
        botMock.verify();
      });

      it("Get counter as regular user", function () {
        let userstateCounter = { badges: {} };
        let stub = sinon
          .stub(pool, "query")
          .yields(null, [{ name: "testcounter", count: 1000 }]);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter", userstateCounter);
        botMock.verify();
      });

      it("Counter not found", function () {
        let stub = sinon.stub(pool, "query").yields(null, []);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter", userstate);
        botMock.verify();
      });

      it("Add 1 (+) to counter", function () {
        let stub = sinon
          .stub(pool, "query")
          .onCall(0)
          .yields(null, [{ name: "testcounter", count: 1000 }])
          .onCall(1)
          .yields(null);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter +", userstate);
        assert.strictEqual(stub.lastCall.args[1][0], 1001);
        botMock.verify();
      });

      it("Subtract 1 (-) from counter", function () {
        let stub = sinon
          .stub(pool, "query")
          .onCall(0)
          .yields(null, [{ name: "testcounter", count: 1000 }])
          .onCall(1)
          .yields(null);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter -", userstate);
        assert.strictEqual(stub.lastCall.args[1][0], 999);
        botMock.verify();
      });

      it("Add 25 (+25) to counter", function () {
        let stub = sinon
          .stub(pool, "query")
          .onCall(0)
          .yields(null, [{ name: "testcounter", count: 1000 }])
          .onCall(1)
          .yields(null);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter +25", userstate);
        assert.strictEqual(stub.lastCall.args[1][0], 1025);
        botMock.verify();
      });

      it("Subtract 25 (-25) from counter", function () {
        let stub = sinon
          .stub(pool, "query")
          .onCall(0)
          .yields(null, [{ name: "testcounter", count: 1000 }])
          .onCall(1)
          .yields(null);
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter testcounter -25", userstate);
        assert.strictEqual(stub.lastCall.args[1][0], 975);
        botMock.verify();
      });

      it("Add new counter", function () {
        let stub = sinon.stub(pool, "query").yields(null);
        botMock
          .expects("say")
          .once()
          .calledWith(undefined, sinon.match(/.*testcounter.*/));
        commands.checkCommand(bot, "!counter add testcounter", userstate);
        assert.strictEqual(stub.lastCall.args[1], "testcounter");
        botMock.verify();
      });

      it("Add duplicate counter", function () {
        let stub = sinon.stub(pool, "query").yields({ code: "ER_DUP_KEY" });
        botMock.expects("say").once();
        commands.checkCommand(bot, "!counter add testcounter", userstate);
        botMock.verify();
      });
    });
  });
});
