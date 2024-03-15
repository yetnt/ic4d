import { CoreHandler } from "./coreHandler";
import { Client } from "discord.js";
import clc = require("cli-color");

export class ReadyHandler extends CoreHandler {
    client: Client;
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
                    throw new Error(
                        `Error running function ${this.functionsToRun.indexOf(
                            fn
                        )} ${clc.underline.italic(
                            str[str.length - 1] != "}" ? str + " ...}" : str
                        )} \n\n` + error
                    );
                }
            }
        });
    }
}
