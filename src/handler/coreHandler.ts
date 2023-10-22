import {
    Client,
    CommandInteraction,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
} from "discord.js";
import * as path2 from "path";
import * as fs from "fs";
import { CommandObject } from "./commandHandler";
import { InteractionObject } from "./interactionHandler";

export interface Choice {
    name: string;
    value: any;
}

export interface Option {
    name: string;
    description: string;
    required: boolean;
    choices: [Choice] | [];
    type: number;
}

/**
 * @class
 * Core handler, contains
 */
export class CoreHandler {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    getInteractions(path: string, commandName?: string): InteractionObject[] {
        let interactions: InteractionObject[] = [];

        const containsDirectories = (path: string): boolean => {
            const items = fs.readdirSync(path);
            let containsDirectories: boolean[] = [];

            for (const item of items) {
                const itemPath = path2.join(path, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                containsDirectories.push(isDirectory);
            }

            return containsDirectories.reduce(
                (acc, currentValue) => acc || currentValue,
                false
            );
        };

        const scanDirectory = (directory: string) => {
            const items = fs.readdirSync(directory);
            let arr: InteractionObject[] = [];

            for (const item of items) {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                /* if (isDirectory && item !== commandName) {
                    const result = containsDirectories(itemPath);
                    if (!result) continue;
                    arr = arr.concat(scanDirectory(itemPath));
                } else */ if (isDirectory /*&& item == commandName*/) {
                    arr = arr.concat(scanDirectory(itemPath));
                    // break;
                } else if (item.endsWith(".js")) {
                    const interactionObject: InteractionObject = require(itemPath);

                    if (!interactionObject.customId) {
                        continue;
                    }

                    arr.push(interactionObject);
                }
            }

            return arr;
        };

        interactions = scanDirectory(path);
        return interactions;
    }

    getLocalCommands(path: string, exceptions?: string[]): CommandObject[] {
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
                    const commandObject: CommandObject = require(itemPath);

                    if (
                        !commandObject.name ||
                        !commandObject.description ||
                        !commandObject.callback ||
                        exceptions.includes(commandObject.name)
                    ) {
                        continue;
                    }

                    arr.push(commandObject);
                }
            }

            return arr;
        };

        localCommands = scanDirectory(path);
        return localCommands;
    }

    getAllFiles(directory: string, foldersOnly?: boolean) {
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

    areCommandsDifferent(
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

    async getApplicationCommands(client: Client, guildId?: string) {
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
        await applicationCommands.fetch();
        return applicationCommands;
    }
}
