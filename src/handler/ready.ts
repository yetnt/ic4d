import { CoreHandler } from "./coreHandler";
import { Client } from "discord.js";
import clc = require("cli-color");

export class ReadyHandler extends CoreHandler {
    client: Client;
    private emitErr: boolean = false;
    private functionsToRun: ((client?: Client) => Promise<void> | void)[] = [];

    /**
     * Call the ReadyHandler.execute() method to run functions.
     * @param client Discord.js Client
     * @param functions Functions to be run when the bot is ready.
     */
    constructor(
        client: Client,
        ...functions: ((client?: Client) => Promise<void> | void)[]
    ) {
        super("rHandler", client);
        this.functionsToRun = functions;
    }

    /**
     * Set whether the ready handler should throw or emit errors. Defaults to false.
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

                    console.error(error);

                    throw new Error(msg);
                }
            }
        });
    }
}
