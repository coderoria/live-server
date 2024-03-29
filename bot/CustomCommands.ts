import { Server } from "socket.io";
import { Client, Userstate } from "tmi.js";
import { Level } from "./Level";

interface CustomCommand {
  name: string;
  aliases: string[];
  requiredLevel: Level;
  answer: Function;
}

export default class CustomCommands {
  registeredCommands: CustomCommand[] = [];
  bot: Client;

  constructor(bot: Client, io: Server) {
    this.bot = bot;
    io.on("connection", (socket) => {
      socket.on(
        "customCommand.add",
        (name, aliases, requiredLevel, answer, callback) => {
          callback(this.addCommand({ name, aliases, requiredLevel, answer }));
        }
      );
    });
  }

  addCommand(cmd: CustomCommand): boolean {
    cmd.aliases = cmd.aliases.map((value) => {
      return value.toLowerCase();
    });
    if (!this.exists(cmd.name, cmd.aliases)) {
      this.registeredCommands.push(<CustomCommand>{
        name: cmd.name.toLowerCase(),
        aliases: cmd.aliases,
        requiredLevel: cmd.requiredLevel,
        answer: cmd.answer,
      });
      return true;
    }
    return false;
  }

  exists(name: string, aliases: string[]): boolean {
    for (let i = 0; i < this.registeredCommands.length; i++) {
      if (this.registeredCommands[i].name == name.toLocaleLowerCase()) {
        return true;
      }
      for (let j = 0; j < aliases.length; j++) {
        if (
          this.registeredCommands[i].aliases.includes(aliases[j].toLowerCase())
        ) {
          return true;
        }
      }
    }
    return false;
  }

  checkCommand(message: string, userstate: Userstate): boolean {
    const re = /^!(\S*)\s?(.*)?$/m;
    const matches = re.exec(message);
    if (matches == null) {
      return false;
    }
    matches.shift();
    let command = matches.shift();
    if (command == undefined) {
      return false;
    }
    command = command.toLowerCase();
    for (let i = 0; i < this.registeredCommands.length; i++) {
      if (
        this.registeredCommands[i].name == command ||
        this.registeredCommands[i].aliases.includes(command)
      ) {
        this.bot.say(
          process.env.CHANNEL as string,
          this.registeredCommands[i].answer()
        );
        return true;
      }
    }
    return false;
  }
}
