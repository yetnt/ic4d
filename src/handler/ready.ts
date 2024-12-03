import { CoreHandler } from "./coreHandler";
import { Client } from "discord.js";
import clc = require("cli-color");
import * as errs from "./Errors";

export class ReadyHandler {
    private core: CoreHandler;
    private client: Client;
    private functionsToRun: ((client?: Client) => Promise<void> | void)[] = [];

    /**
     * @param core CoreHandler instance
     * @param shardClient The Discord.js Client instance to use. If provided, it should be a shard-specific client.
     * If left undefined, the `client` instance from the coreHandler will be used by default.
     * @param functions Functions to be run when the bot is ready.
     *
     * @remarks
     * Call the ReadyHandler.execute() method to run functions.
     */
    constructor(
        core: CoreHandler,
        shardClient: Client = undefined,
        ...functions: ((client?: Client) => Promise<void> | void)[]
    ) {
        this.core = core;
        this.client = shardClient || core.client;
        core.debug.newLogs("rHandler", "ReadyHandler constructor called.");
        if (!this.client)
            throw new errs.ic4dError(
                undefined,
                "received client of undefined",
                undefined,
                undefined
            );
        this.functionsToRun = functions;
    }

    /**
     * Run functions when the bot starts.
     */
    async execute() {
        this.client.on("ready", async () => {
            for (const fn of this.functionsToRun) {
                try {
                    await fn(this.core.client);
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
