import {
    Client,
    CommandInteraction,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    ApplicationCommandOptionType,
} from "discord.js";
import * as path2 from "path";
import * as fs from "fs";
import { CommandObject } from "./commandHandler";
import { ContextMenuObject, InteractionObject } from "./interactionHandler";
import {
    Interactions,
    CommandInteractionObject,
    InteractionBuilder,
} from "./builders/builders";
import { EventEmitter } from "events";

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

/**
 * Represents a choice
 */
export interface Choice {
    /**
     * Choice name
     */
    name: string;
    /**
     * Choice value
     */
    value: any;
}

/**
 * Represents an option for a slash command
 */
export interface Option {
    /**
     * The name of the  option
     */
    name: string;
    /**
     * Description of the option
     */
    description: string;
    /**
     * Whether the option is required or not
     */
    required?: boolean;
    /**
     * An array of predefined choices.
     */
    choices?: Choice[];
    /**
     * Type of option
     */
    type: ApplicationCommandOptionType;
}

/**
 * Switches the type from a command interaciton object to the interaction object the code uses.
 * @param cI InteractionBuilder
 * @returns
 */
function change(
    cI: CommandInteractionObject | InteractionBuilder
): InteractionObject {
    const a: InteractionObject = {
        customId: cI.customId,
        type: cI.type,
        callback: cI.callback,
        filePath: cI.filePath,
        onlyAuthor: cI.onlyAuthor,
        timeout: cI.timeout,
        onTimeout: cI.onTimeout,
    };

    return a;
}

/**
 * Extract all interactions from a command into one array full of them.
 * @param interactionsObject Object at which the interactions are stored as CommandObjectInteraction
 * @param filePath appends filepath.
 * @returns
 */
export function extractAllInteractions(
    interactionsObject: Interactions,
    filePath: string
): InteractionObject[] {
    const allInteractions: InteractionObject[] = [];

    for (const key in interactionsObject) {
        if (interactionsObject.hasOwnProperty(key)) {
            const objects = interactionsObject[key as keyof Interactions]; // Type assertion here
            const keys = Object.keys(objects) as (keyof typeof objects)[];

            for (const objKey of keys) {
                let current = objects[objKey];
                current.filePath = filePath;
                allInteractions.push(change(current));
            }
        }
    }

    return allInteractions;
}

const isEmpty = (obj: Record<string, any>) => !Object.keys(obj).length;

/**
 * @class
 * Core handler, contains
 */
export class CoreHandler extends EventEmitter {
    client: Client;

    constructor(client: Client) {
        super();
        this.client = client;
    }

    protected getInteractions(
        path: string,
        getContextMenusOnly?: boolean
    ): (ContextMenuObject | InteractionObject)[] | ContextMenuObject[] {
        let interactions:
            | (ContextMenuObject | InteractionObject)[]
            | ContextMenuObject[] = [];

        const scanDirectory = (directory: string) => {
            const items = fs.readdirSync(directory);
            let arr: (ContextMenuObject | InteractionObject)[] = [];

            for (const item of items) {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                if (isDirectory) {
                    arr = arr.concat(scanDirectory(itemPath));
                } else if (item.endsWith(".js")) {
                    const interactionObject: InteractionObject & {
                        name: string;
                        type: string | number;
                        interactions?: Interactions;
                    } = require(itemPath);

                    if (getContextMenusOnly == true) {
                        if (
                            !interactionObject.type ||
                            !interactionObject.name ||
                            typeof interactionObject.type !== "number"
                        ) {
                            continue;
                        }
                        interactionObject.filePath = itemPath;
                        arr.push(interactionObject);
                    } else {
                        if (
                            interactionObject.interactions &&
                            !isEmpty(interactionObject.interactions)
                        ) {
                            let interactions = extractAllInteractions(
                                interactionObject.interactions,
                                itemPath
                            );
                            arr.push(...interactions);
                        } else {
                            if (!interactionObject.customId) {
                                continue;
                            }
                            interactionObject.onlyAuthor =
                                interactionObject.onlyAuthor == true
                                    ? true
                                    : interactionObject.authorOnly == true
                                    ? true
                                    : false;
                            interactionObject.filePath = itemPath;
                            arr.push(interactionObject);
                        }
                    }
                }
            }

            return arr;
        };

        interactions = scanDirectory(path);
        return interactions;
    }

    protected getLocalCommands(
        path: string,
        exceptions?: string[]
    ): CommandObject[] {
        exceptions = exceptions !== undefined ? exceptions : [];
        let localCommands: CommandObject[] = [];

        const scanDirectory = (directory: string) => {
            const items = fs.readdirSync(directory);
            let arr: CommandObject[] = [];

            for (const item of items) {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                if (isDirectory) {
                    arr = arr.concat(scanDirectory(itemPath));
                } else if (item.endsWith(".js")) {
                    const commandObject: CommandObject & {
                        isCommand?: boolean;
                        customId?: string;
                    } = require(itemPath);

                    if (
                        !commandObject.description ||
                        commandObject.isCommand ||
                        commandObject.customId ||
                        exceptions.includes(commandObject.name)
                    ) {
                        continue;
                    }
                    commandObject.filePath = itemPath;
                    arr.push(commandObject);
                }
            }

            return arr;
        };

        localCommands = scanDirectory(path);
        return localCommands;
    }

    protected getAllFiles(directory: string, foldersOnly?: boolean) {
        foldersOnly = foldersOnly !== undefined ? foldersOnly : false;
        let fileNames: string[] = [];

        const files = fs.readdirSync(directory, { withFileTypes: true });

        for (const file of files) {
            const filePath = path2.join(directory, file.name);

            if (foldersOnly) {
                if (file.isDirectory()) {
                    fileNames.push(filePath);
                }
            } else {
                if (file.isFile()) {
                    fileNames.push(filePath);
                }
            }
        }

        return fileNames;
    }

    protected areCommandsDifferent(
        existingCommand: CommandInteraction | any,
        localCommand: CommandObject
    ) {
        const areChoicesDifferent = (
            existingChoices: Choice[] | [],
            localChoices: Choice[] | []
        ) => {
            for (const localChoice of localChoices) {
                const existingChoice = existingChoices?.find(
                    //@ts-ignore
                    (choice) => choice.name === localChoice.name
                );

                if (!existingChoice) {
                    return true;
                }

                if (localChoice.value !== existingChoice.value) {
                    return true;
                }
            }
            return false;
        };

        const areOptionsDifferent = (
            existingOptions: Option[] | [],
            localOptions: Option[] | []
        ) => {
            localOptions = localOptions !== undefined ? localOptions : [];
            for (const localOption of localOptions) {
                const existingOption = existingOptions?.find(
                    // @ts-ignore
                    (option) => option.name === localOption.name
                );

                if (!existingOption) {
                    return true;
                }

                if (
                    localOption.description !== existingOption.description ||
                    localOption.type !== existingOption.type ||
                    (localOption.required || false) !==
                        existingOption.required ||
                    (localOption.choices?.length || 0) !==
                        (existingOption.choices?.length || 0) ||
                    areChoicesDifferent(
                        localOption.choices || [],
                        existingOption.choices || []
                    )
                ) {
                    return true;
                }
            }
            return false;
        };

        if (
            existingCommand.description !== localCommand.description ||
            existingCommand.options?.length !==
                (localCommand.options?.length || 0) ||
            areOptionsDifferent(existingCommand.options, localCommand.options)
        ) {
            return true;
        }

        return false;
    }

    protected areContextMenusDifferent(
        existing: ContextMenuObject,
        local: ContextMenuObject
    ): boolean {
        return existing.type == local.type;
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
