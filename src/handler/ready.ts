import { CoreHandler } from "./coreHandler";
import { Client } from "discord.js";
import clc = require("cli-color");

export class ReadyHandler extends CoreHandler {
    client: Client;
    emitErr: boolean = false;
    private functionsToRun: ((client?: Client) => void)[] = [];

    /**
     * Call the ReadyHandler.execute() method to run functions.
     * @param client Discord.js Client
     * @param functions Functions to be run when the bot is ready.
     */
    constructor(client: Client, ...functions: ((client?: Client) => void)[]) {
        super(client);
        this.functionsToRun = functions;
    }

    /**
     * Set whether the command handler should throw or emit errors. Defaults to false.
     * @param bool Boolean value
     */
    emitErrors(bool: boolean): void {
        this.emitErr = bool == true ? true : false;
    }

    /**
     * Run functions when the bot starts.
     */
    async execute() {
        this.client.on("ready", async () => {
            for (const fn of this.functionsToRun) {
                try {
                    await fn(this.client);
                } catch (error) {
                    let str = fn
                        .toString()
                        .replace(/\s+/g, " ")
                        .substring(0, 80);

                    let msg =
                        `Error running function ${this.functionsToRun.indexOf(
                            fn
                        )} ${clc.underline.italic(
                            str[str.length - 1] != "}" ? str + " ...}" : str
                        )} \n\n` + error;

                    if (this.emitErr) {
                        this.emit("error", msg);
                    } else {
                        throw new Error(msg);
                    }
                }
            }
        });
    }
}
