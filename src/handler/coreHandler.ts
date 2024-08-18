import {
    Client,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    ApplicationCommandOptionType,
    ApplicationCommand,
} from "discord.js";
import * as path2 from "path";
import * as fs from "fs";
import {
    Choice,
    Option,
    CommandObject,
    ContextMenuObject,
    InteractionObject,
} from "./interfaces";
import {
    Interactions,
    InteractionBuilder,
    SlashCommandManager,
} from "./builders/builders";

import * as clc from "cli-color";
import bare = require("cli-color/bare");
import { appendFileSync } from "fs";

function change(cI: InteractionBuilder): InteractionObject {
    return {
        customId: cI.customId,
        type: cI.type,
        callback: cI.callback,
        filePath: cI.filePath,
        onlyAuthor: cI.onlyAuthor,
        timeout: cI.timeout,
        onTimeout: cI.onTimeout,
    };
}

export function extractAllInteractions(
    interactionsObject: Interactions,
    filePath: string
): InteractionObject[] {
    return Object.values(interactionsObject).flatMap((objects) =>
        Object.values(objects).map((current) => {
            current.filePath = filePath;
            return change(current);
        })
    );
}

function findCommandInstance(
    module: Record<string, any>
): SlashCommandManager | { isCommand: boolean } {
    // Iterate over the module's exports to find an instance of CommandHandler
    for (const value of Object.values(module)) {
        if (value instanceof SlashCommandManager) {
            return value;
        }
    }

    return { isCommand: false };
}

type cmd = {
    isCommand?: boolean;
    customId?: string;
    filePath?: string;
} & SlashCommandManager;

const isEmpty = (obj: Record<string, any>) => Object.keys(obj).length === 0;

export class CoreHandler {
    client: Client;
    coreFlags: { debugger: boolean; logToFile: string | false } = {
        debugger: false,
        logToFile: false,
    };

    protected currentDate() {
        const date = new Date(Date.now());
        const arr = [
            "[ ",
            date.getHours(),
            ":",
            date.getMinutes(),
            ":",
            date.getSeconds(),
            " ",
            date.getDate(),
            "-",
            date.getMonth() + 1,
            "-",
            date.getFullYear(),
            " ]",
        ];

        return arr.join("");
    }

    /**
     * Either Logs to the console or writes to a file. If to the console, clc coloruing will be used.
     * @param x String to log or write
     * @param clc clc colouring.
     * @param stdout Print via procress.stdout
     */
    protected logOrWrite(x: string, col?: bare.Format, stdout?: boolean): void {
        if (this.coreFlags.logToFile) {
            x = x.replace(/\x1b\[([0-9;]*)m/g, "");
            try {
                // If `logToFile` is a valid file path, append the message with a newline
                appendFileSync(
                    this.coreFlags.logToFile,
                    this.currentDate() + " " + x + "\n",
                    "utf8"
                );
            } catch (err) {
                console.log("logOrWrite() function failed to write to file!:");
                console.error(err);
            }
        } else {
            let string = col ? col(x) : x;
            stdout ? process.stdout.write(string) : console.debug(string);
        }
    }

    /**
     * Object of debuger helper function which take in a string and use clc to colour it and ouput whatever debug message to the console.
     * Only used by the InteractionHandler and CommandHandler, That's why it's protected, the user doesn't need this.
     */
    protected debug = {
        /**
         * Custom string that already has clc colouring.
         * @param x String to log to the console.
         */
        custom: (x: string): void => {
            this.logOrWrite(x); // this is red and red has any type???
        },

        /**
         * Common Text.
         * @param x String tot log to the console.
         */
        common: (x: string): void => {
            this.logOrWrite(x, clc.underline);
        },

        /**
         * Common Blue Text
         */
        commonBlue: (x: string): void => {
            this.logOrWrite(x, clc.blue.bold);
        },

        /**
         * Top Level Message for the debugger. Used to tell the user which function has started running
         * @param x String to log to the console.
         */
        topMsg: (x: string): void => {
            this.logOrWrite(
                "\n" + x + " has been called and has started executing.\n",
                clc.underline.blue
            );
        },
        /**
         * Used when the CommandHandler and InteravctionHander refresh the applicat5ion command.
         * Commands use stdout instead of console.log cuz new line
         */
        refresh: {
            /**
             * An item in a list of multiple items that have been deleted. Used by the ComandHandler and InteractionHandler when refreshing application commands.
             * @param x String to log to the console
             */
            sMsg: (x: string): void => {
                this.logOrWrite(x + ", ", clc.red.underline);
            },
            /**
             * Final Message to log to the console. (Logs the string "have been deleted.")
             */
            lMsg: (): void => {
                this.logOrWrite("have been deleted.", clc.red.underline);
            },
        },
    };

    constructor(client: Client, debugMode = false, logToFile?: string | false) {
        this.client = client;
        this.coreFlags.debugger = debugMode || false;
        this.coreFlags.logToFile = logToFile || false;
    }

    protected getInteractions(
        path: string,
        getContextMenusOnly: boolean = false
    ): (ContextMenuObject | InteractionObject)[] | ContextMenuObject[] {
        const scanDirectory = (
            directory: string
        ): (ContextMenuObject | InteractionObject)[] => {
            return fs.readdirSync(directory).flatMap((item) => {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                if (isDirectory) {
                    return scanDirectory(itemPath);
                } else if (item.endsWith(".js")) {
                    const interactionObject: InteractionObject & {
                        name: string;
                        type: string | number;
                        interactions?: Interactions;
                    } = require(itemPath);

                    if (getContextMenusOnly === true) {
                        if (
                            !interactionObject.type ||
                            !interactionObject.name ||
                            typeof interactionObject.type !== "number"
                        ) {
                            return [];
                        }
                        interactionObject.filePath = itemPath;
                        return [interactionObject];
                    } else {
                        if (
                            interactionObject.interactions &&
                            !isEmpty(interactionObject.interactions)
                        ) {
                            return extractAllInteractions(
                                interactionObject.interactions,
                                itemPath
                            );
                        }
                        // } else {
                        //     if (!interactionObject.customId) {
                        //         return [];
                        //     }
                        //     interactionObject.onlyAuthor =
                        //         interactionObject.onlyAuthor ||
                        //         interactionObject.authorOnly === true;
                        //     interactionObject.filePath = itemPath;
                        //     return [interactionObject];
                        // }
                    }
                }
                return [];
            });
        };

        return scanDirectory(path);
    }

    protected getLocalCommands(
        path: string,
        exceptions: string[] = []
    ): CommandObject[] {
        const scanDirectory = (directory: string): SlashCommandManager[] => {
            return fs.readdirSync(directory).flatMap((item) => {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                if (isDirectory) {
                    return scanDirectory(itemPath);
                } else if (item.endsWith(".js")) {
                    let commandObject:
                        | cmd
                        | {
                              isCommand: boolean;
                              description?: null;
                              customId?: "!";
                              name?: string;
                          } = require(itemPath);
                    if (!(commandObject instanceof SlashCommandManager)) {
                        commandObject = findCommandInstance(require(itemPath));
                    }

                    if (
                        !commandObject.description ||
                        commandObject.isCommand ||
                        commandObject.customId ||
                        exceptions.includes(commandObject.name)
                    ) {
                        return [];
                    }
                    commandObject = <cmd>commandObject;
                    // It's a valid command, now proceed with checks.
                    commandObject.filePath = itemPath;
                    return [commandObject];
                }
                return [];
            });
        };

        return scanDirectory(path);
    }

    protected getAllFiles(
        directory: string,
        foldersOnly: boolean = false
    ): string[] {
        return fs
            .readdirSync(directory, { withFileTypes: true })
            .filter((file) =>
                foldersOnly ? file.isDirectory() : file.isFile()
            )
            .map((file) => path2.join(directory, file.name));
    }

    protected areCommandsDifferent(
        existingCommand: ApplicationCommand,
        localCommand: CommandObject
    ): boolean {
        const areChoicesDifferent = (
            existingChoices: Choice[] = [],
            localChoices: Choice[] = []
        ): boolean => {
            return localChoices.some((localChoice) => {
                const existingChoice = existingChoices.find(
                    (choice) => choice.name === localChoice.name
                );
                return (
                    !existingChoice ||
                    localChoice.value !== existingChoice.value
                );
            });
        };

        const areOptionsDifferent = (
            existingOptions: Option[] = [],
            localOptions: Option[] = []
        ): boolean => {
            return localOptions.some((localOption) => {
                const existingOption = existingOptions.find(
                    (option) => option.name === localOption.name
                );
                return (
                    !existingOption ||
                    localOption.description !== existingOption.description ||
                    localOption.type !== existingOption.type ||
                    (localOption.required || false) !==
                        existingOption.required ||
                    (localOption.choices?.length || 0) !==
                        (existingOption.choices?.length || 0) ||
                    areChoicesDifferent(
                        localOption.choices,
                        existingOption.choices
                    )
                );
            });
        };

        return (
            existingCommand.description !== localCommand.description ||
            (existingCommand.options?.length || 0) !==
                (localCommand.options?.length || 0) ||
            areOptionsDifferent(
                //@ts-ignore
                existingCommand.options,
                localCommand.options
            ) ||
            existingCommand.nsfw !==
                (localCommand.data
                    ? localCommand.data?.nsfw
                        ? localCommand.data?.nsfw
                        : false
                    : false)
        );
    }

    protected areContextMenusDifferent(
        existing: ApplicationCommand,
        local: ContextMenuObject
    ): boolean {
        return existing.type !== local.type;
    }

    protected async getApplicationCommands(client: Client, guildId?: string) {
        let applicationCommands:
            | ApplicationCommandManager
            | GuildApplicationCommandManager;

        if (guildId) {
            const guild = await client.guilds.fetch(guildId);
            applicationCommands = guild.commands;
        } else {
            applicationCommands = await client.application.commands;
        }

        //@ts-ignore
        await applicationCommands.fetch({ locale: "en-GB" });
        return applicationCommands;
    }
}
