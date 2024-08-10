import {
    Client,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    ApplicationCommandOptionType,
    ApplicationCommand,
} from "discord.js";
import * as path2 from "path";
import * as fs from "fs";
import { CommandObject } from "./commandHandler";
import { ContextMenuObject, InteractionObject } from "./interactionHandler";
import {
    Interactions,
    InteractionBuilder,
    SlashCommandManager,
    ContextMenuBuilder,
} from "./builders/builders";

/**
 * Interface that represents default string values for the loader to log to the console when it encounters a command/context menu.
 * 
 * Make sure you keep `NAME` in the string or else you will not know what happened to which command.
If there is no log in the console for a specific command, then it has been loaded, there are no edits and it has not been deleted.
 */
export interface LoaderOptions {
    /**
     * What to show for context menus/commands that load in
     */
    loaded: string;
    /**
     * What to show for context menus/commands that get edited.
     */
    edited: string;
    /**
     * What to show for context menus/commands that get deleted.
     */
    deleted: string;
    /**
     * What to show for context menus/commands that get skipped. (Deleted and still marked as deleted.)
     */
    skipped: string;
    /**
     * What to show for context menus/commands that get loaded, but have no changes
     */
    loadedNoChanges?: string;
}

export interface Choice {
    name: string;
    value: any;
}

export interface Option {
    name: string;
    description: string;
    required?: boolean;
    choices?: Choice[];
    type: ApplicationCommandOptionType;
}

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
): SlashCommandManager | null {
    // Iterate over the module's exports to find an instance of CommandHandler
    for (const value of Object.values(module)) {
        if (value instanceof SlashCommandManager) {
            return value;
        }
    }

    return null;
}

type cmd = {
    isCommand?: boolean;
    customId?: string;
    filePath?: string;
} & SlashCommandManager;

const isEmpty = (obj: Record<string, any>) => Object.keys(obj).length === 0;

export class CoreHandler {
    client: Client;

    constructor(client: Client) {
        this.client = client;
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
        es: boolean = false,
        exceptions: string[] = []
    ): CommandObject[] {
        const scanDirectory = (directory: string): SlashCommandManager[] => {
            return fs.readdirSync(directory).flatMap((item) => {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                if (isDirectory) {
                    return scanDirectory(itemPath);
                } else if (item.endsWith(".js")) {
                    let commandObject: cmd;
                    if (es) {
                        commandObject = findCommandInstance(require(itemPath));
                    } else {
                        commandObject = require(itemPath);
                    }

                    if (
                        !commandObject.description ||
                        commandObject.isCommand ||
                        commandObject.customId ||
                        exceptions.includes(commandObject.name)
                    ) {
                        return [];
                    }
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
