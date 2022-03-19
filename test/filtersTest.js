var assert = require("assert");
var sinon = require("sinon");
let filters = require("../bot/filters");

let userstate = {
  username: "testuser",
  "display-name": "TestUser",
  emotes: {},
  mod: false,
  id: 1234,
};
let bot = {
  deletemessage: function () {},
  timeout: function () {},
  say: function () {},
  ban: function () {},
};

describe("Filters", function () {
  it("Normal message", function () {
    assert(
      !filters.checkMessage(bot, "This is a normal message Kappa", userstate)
    );
  });

  describe("Caps filter", function () {
    it("HELLO THAT IS ME", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("deletemessage").resolves().once();
      assert(filters.checkMessage(bot, "HELLO THAT IS ME", userstate));
      botMock.verify();
    });

    it("HELLO THAT IS ME LOL", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("deletemessage").resolves().once();
      assert(filters.checkMessage(bot, "HELLO THAT IS ME LOL", userstate));
      botMock.verify();
    });
  });

  describe("Link filter", function () {
    it("https://google.com", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("deletemessage").resolves().once();
      assert(filters.checkMessage(bot, "https://google.com", userstate));
      botMock.verify();
    });

    it("https://clips.twitch.tv/Bla", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("deletemessage").resolves().never();
      assert(
        !filters.checkMessage(bot, "https://clips.twitch.tv/Bla", userstate)
      );
      botMock.verify();
    });
  });

  describe("Emote filter", function () {
    it("Single emote <10", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("deletemessage").resolves().never();
      let userstateEmotes = userstate;
      userstateEmotes.emotes = { 25: ["0-4", "5-9", "10-14"] };
      assert(!filters.checkMessage(bot, "notrelevant", userstateEmotes));
      botMock.verify();
    });

    it("Single emote >10", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("timeout").resolves().once();
      let userstateEmotes = userstate;
      userstateEmotes.emotes = {
        25: [
          "0-4",
          "5-9",
          "10-14",
          "15-19",
          "20-24",
          "25-29",
          "30-34",
          "35-39",
          "40-44",
          "45-49",
          "50-54",
        ],
      };
      assert(filters.checkMessage(bot, "notrelevant", userstateEmotes));
      botMock.verify();
    });

    it("Multiple emotes <10", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("timeout").resolves().never();
      let userstateEmotes = userstate;
      userstateEmotes.emotes = {
        25: ["0-4", "5-9", "10-14"],
        26: ["15-19", "20-24", "25-29"],
      };
      assert(!filters.checkMessage(bot, "notrelevant", userstateEmotes));
      botMock.verify();
    });

    it("Multiple emotes >10", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("timeout").resolves().once();
      let userstateEmotes = userstate;
      userstateEmotes.emotes = {
        25: ["0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34"],
        26: ["35-39", "40-44", "45-49", "50-54"],
      };
      assert(filters.checkMessage(bot, "notrelevant", userstateEmotes));
      botMock.verify();
    });
  });

  describe("Spam letters filter", function () {
    it("Disruptive ZAlgo", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("ban").resolves().once();
      assert(filters.checkMessage(bot, "t̴̝͖͚̔̿̓̓̒͗ë̵̮̪́s̵̳͇̗͚̠̤̽̈ṯ̷̬͖͖̩̓̉̽̔̌", userstate));
      botMock.verify();
    });

    it("Sneaky ZAlgo", function () {
      let botMock = sinon.mock(bot);
      botMock.expects("ban").resolves().once();
      assert(filters.checkMessage(bot, "t̴e̴s̷t̵", userstate));
      botMock.verify();
    });
  });
});
