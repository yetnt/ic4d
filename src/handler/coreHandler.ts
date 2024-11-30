import {
    Client,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    ApplicationCommandOptionType,
    ApplicationCommand,
    ChatInputCommandInteraction,
    ButtonInteraction,
    AnySelectMenuInteraction,
    ModalSubmitInteraction,
} from "discord.js";
import * as path2 from "path";
import * as fs from "fs";
import {
    Choice,
    Option,
    CommandObject,
    ContextMenuObject,
    InteractionObject,
    HandlerVariables,
    addInteractionVariables,
} from "./interfaces";
import {
    Interactions,
    InteractionBuilder,
    SlashCommandManager,
} from "./builders/builders";
import { EventEmitter } from "events";

import * as clc from "cli-color";
import bare = require("cli-color/bare");
import { appendFileSync } from "fs";
import { ic4dError } from "./Errors";

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
    Object.values(module).forEach((value) => {
        if (value instanceof SlashCommandManager) {
            return value;
        }
    });

    return { isCommand: false };
}

type cmd = {
    isCommand?: boolean;
    customId?: string;
    filePath?: string;
} & SlashCommandManager;

const isEmpty = (obj: Record<string, any>) => Object.keys(obj).length === 0;
export type Handlers = "iHandler" | "cHandler" | "rHandler";
export class CoreHandler extends EventEmitter {
    client: Client;
    v: Record<string, any> = {};
    variables = {
        add: async (
            interaction: ChatInputCommandInteraction,
            commandObject: CommandObject,
            k: any
        ) => {
            try {
                const messageId = await interaction
                    .fetchReply()
                    .then((d) => d.id);
                const interactionIds: string = Object.values(
                    commandObject.interactions
                )
                    .filter((interactionType) => interactionType) // Ensure interactionType is not undefined
                    .flatMap((interactionType) =>
                        Object.values(interactionType)
                    ) // Get all InteractionBuilder objects
                    .map((builder) => builder.customId) // Extract ids from the InteractionBuilder object's ID
                    .join(HandlerVariables.Separators.INTERACTION_IDS);

                const id = [interactionIds, messageId].join(
                    HandlerVariables.Separators.DEFAULT
                );

                this.v[id] = k;
            } catch (error) {
                let err = new ic4dError(
                    undefined,
                    "Loading interactions variables sent from $NAME$ failed with the error:\n\n",
                    undefined,
                    interaction.commandName
                );

                throw err;
            }
        },
        get: (
            interaction:
                | ButtonInteraction
                | AnySelectMenuInteraction
                | ModalSubmitInteraction
                | ChatInputCommandInteraction,
            customId: string
        ) => {
            // Use `find` instead of `filter`
            const varEntry = Object.entries(this.v).find(async ([key]) => {
                const [interactionIds, messageId] = key.split(
                    HandlerVariables.Separators.DEFAULT
                );
                const interactionMessageId = await interaction
                    .fetchReply()
                    .then((d) => d.id);

                return (
                    interactionIds
                        .split(HandlerVariables.Separators.INTERACTION_IDS)
                        .includes(customId) &&
                    messageId === interactionMessageId
                );
            });

            // Return the variable if found, otherwise undefined
            return varEntry ? varEntry[1] : undefined;
        },
    };
    coreFlags: { debugger: boolean; logToFolder: string | false } = {
        debugger: false,
        logToFolder: false,
    };

    currentTime() {
        const date = new Date(Date.now());
        const arr = [
            "[ ",
            date.getHours(),
            ":",
            date.getMinutes(),
            ":",
            date.getSeconds(),
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
    logOrWrite(
        subClassName: Handlers,
        x: string,
        col?: bare.Format,
        stdout?: boolean
    ): void {
        if (this.coreFlags.logToFolder) {
            x = x.replace(/\x1b\[([0-9;]*)m/g, "");
            try {
                const date = new Date(Date.now());
                const path = path2.join(
                    this.coreFlags.logToFolder,
                    date.getDate() +
                        "-" +
                        (date.getMonth() + 1) +
                        "-" +
                        date.getFullYear() +
                        "_" +
                        subClassName +
                        ".log.txt"
                );
                // If `logToFile` is a valid file path, append the message with a newline
                appendFileSync(
                    path,
                    this.currentTime() + " " + x + "\n\n",
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
    debug = {
        /**
         * Custom string that already has clc colouring.
         * @param x String to log to the console.
         */
        custom: (handler: Handlers, x: string): void => {
            this.logOrWrite(handler, x); // this is red and red has any type???
        },

        /**
         * Common Text.
         * @param x String tot log to the console.
         */
        common: (handler: Handlers, x: string): void => {
            this.logOrWrite(handler, x, clc.underline);
        },

        /**
         * Common Blue Text
         */
        commonBlue: (handler: Handlers, x: string): void => {
            this.logOrWrite(handler, x, clc.blue.bold);
        },

        /**
         * Top Level Message for the debugger. Used to tell the user which function has started running
         * @param x String to log to the console.
         */
        topMsg: (handler: Handlers, x: string): void => {
            this.logOrWrite(
                handler,
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
            sMsg: (handler: Handlers, x: string): void => {
                this.logOrWrite(handler, x + ", ", clc.red.underline);
            },
            /**
             * Final Message to log to the console. (Logs the string "have been deleted.")
             */
            lMsg: (handler: Handlers): void => {
                this.logOrWrite(
                    handler,
                    "have been deleted.",
                    clc.red.underline
                );
            },
        },
    };

    constructor(
        client: Client,
        debugMode = false,
        logToFolder: string | false = false
    ) {
        super();
        this.client = client;
        this.coreFlags.debugger = debugMode || false;
        this.coreFlags.logToFolder = logToFolder || false;
    }

    getInteractions(
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

    getLocalCommands(path: string, exceptions: string[] = []): CommandObject[] {
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

    getAllFiles(directory: string, foldersOnly: boolean = false): string[] {
        return fs
            .readdirSync(directory, { withFileTypes: true })
            .filter((file) =>
                foldersOnly ? file.isDirectory() : file.isFile()
            )
            .map((file) => path2.join(directory, file.name));
    }

    areCommandsDifferent(
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

    areContextMenusDifferent(
        existing: ApplicationCommand,
        local: ContextMenuObject
    ): boolean {
        return existing.type !== local.type;
    }

    async getApplicationCommands(guildId?: string) {
        let applicationCommands:
            | ApplicationCommandManager
            | GuildApplicationCommandManager;

        if (guildId) {
            const guild = await this.client.guilds.fetch(guildId);
            applicationCommands = guild.commands;
        } else {
            applicationCommands = await this.client.application.commands;
        }

        //@ts-ignore
        await applicationCommands.fetch({ locale: "en-GB" });
        return applicationCommands;
    }

    /**
     * Sets up a collector for message components with a specified timeout.
     *
     * @param client - The Discord client instance.
     * @param initInteraction - The initial interaction that triggered the setup.
     * @param interaction - An object containing the interaction details, including the onTimeout function, timeout duration, and customId.
     */
    setupCollector(
        client: Client,
        initInteraction: ChatInputCommandInteraction,
        interaction: InteractionBuilder
    ) {
        const { onTimeout, timeout, customId } = interaction;

        const collector =
            initInteraction.channel.createMessageComponentCollector({
                time: timeout,
                filter: (i) => i.customId === customId,
            });

        collector.once("collect", (i) => {
            // Handle the button click here or simply notify that it was clicked
            // i.reply({ content: "Button was clicked!", ephemeral: true });
            collector.stop("respondedInTime"); // Stop the collector after a click is detected. This is in a comment because when it's run it emits the "end" event.
        });

        collector.once("end", async (collected, reason) => {
            if (reason !== "respondedInTime")
                await onTimeout(
                    initInteraction,
                    client,
                    this.variables.get(initInteraction, interaction.customId)
                );
        });
    }
}
