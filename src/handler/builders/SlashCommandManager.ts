import {
    Client,
    PermissionFlags,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import { Option } from "../coreHandler";
import {
    InteractionType,
    CommandInteractionObject,
    InteractionBuilder,
} from "./builders";

export type Interactions = {
    [key in InteractionType]?: {
        [key: string]: CommandInteractionObject | InteractionBuilder;
    };
};

/**
 * Represents a single slash command.
 */
export class SlashCommandManager {
    /**
     *
     */
    data: RESTPostAPIApplicationCommandsJSONBody;
    /**
     * The name of the command
     */
    name: string;
    /**
     * The description of the command
     */
    description: string;
    /**
     * Function run when this command is called
     */
    callback: (
        client: Client,
        interaction: ChatInputCommandInteraction
    ) => void;
    /**
     * An array of options
     */
    options: Option[];
    /**
     * A object of the command's interactions
     */
    interactions: Interactions = {};
    /**
     * Permission required by the user to proceed with the command
     */
    permissionsRequired?: bigint[] = [];
    /**
     * Permission required by the bot to proceed with the command
     */
    botPermissions?: bigint[] = [];
    /**
     * Whether the command is deleted or not
     */
    deleted: boolean;
    /**
     *
     */
    protected isOld: boolean = false;

    constructor(commandObject: {
        /**
         * Slash Command data.
         */
        data: SlashCommandBuilder;
        /**
         * Function run when this command is called
         */
        execute: (
            interaction: ChatInputCommandInteraction,
            client?: Client
        ) => void;
    });
    constructor(obj: {
        data: SlashCommandBuilder;
        execute: (
            interaction: ChatInputCommandInteraction,
            client?: Client
        ) => void;
    }) {
        this.data = obj.data.toJSON();
        this.name = obj.data.name;
        this.description = obj.data.description;
        this.options = obj.data.options.map((option) => option.toJSON()) || [];
        this.callback = function command(
            client: Client,
            interaction: ChatInputCommandInteraction
        ) {
            obj.execute(interaction, client);
        };
    }

    /**
     * Set the permissions required by the user to use this command.
     * @param perms Array of PermissionFlags
     */
    setUserPermissions(...perms: bigint[]): SlashCommandManager {
        this.permissionsRequired = perms;
        return this;
    }

    /**
     * Set the permissions required by the bot for this command to execute.
     * @param perms Array of PermissionFlags
     */
    setBotPermissions(...perms: bigint[]): SlashCommandManager {
        this.botPermissions = perms;
        return this;
    }

    /**
     * Set whether or not this command is deleted. If deleted and loader tries to load it, it will be skipped.
     * @param bool If true, command is marked as deleted.
     */
    setDeleted(bool: boolean): SlashCommandManager {
        this.deleted = bool;
        return this;
    }

    /**
     * Append all the interactions associated with this command, here if you'd like.
     * @param interactions
     */
    addInteractions(
        ...interactions: InteractionBuilder[]
    ): SlashCommandManager {
        interactions.forEach((inter) => {
            this.interactions[inter.type] ||= {};
            this.interactions[inter.type]![inter.customId] = inter;
        });
        return this;
    }
}

/**
 * Represents a slash command
 * @deprecated Use SlashCommandManager class instead.
 */
export class SlashCommandObject {
    /**
     * The name of the command
     */
    name: string;
    /**
     * The description of the command
     */
    description: string;
    /**
     * Function run when this command is called
     */
    callback: (
        client: Client,
        interaction: ChatInputCommandInteraction
    ) => void;
    /**
     * An array of options
     */
    options: Option[];
    /**
     * A object of the command's interactions
     */
    interactions: Interactions = {};
    /**
     * Permission required by the user to proceed with the command
     */
    permissionsRequired?: PermissionFlags[] = [];
    /**
     * Permission required by the bot to proceed with the command
     */
    botPermissions?: PermissionFlags[] = [];
    /**
     * Whether the command is deleted or not
     */
    deleted: boolean;

    /**
     * Build the actual command. Either Via CommandObject or entering the tradiontial method in the `commandObject` parameter
     * @param commandObject Command Object with properties
     * @param interaction Interactions associated with the command
     */
    constructor(
        commandObject: {
            /**
             * The name of the command
             */
            name: string;
            /**
             * The description of the command
             */
            description: string;
            /**
             * Function run when this command is called
             */
            callback: (
                client: Client,
                interaction: ChatInputCommandInteraction
            ) => void;
            /**
             * An array of options
             */
            options?: Option[];
            /**
             * Permission required by the user to proceed with the command
             */
            permissionsRequired?: PermissionFlags[];
            /**
             * Permission required by the bot to proceed with the command
             */
            botPermissions?: PermissionFlags[];
            /**
             * Whether the command is deleted or not
             */
            deleted?: boolean;
        },
        ...interaction: CommandInteractionObject[]
    );
    constructor(
        commandObject: {
            /**
             * Slash Command data.
             */
            data: SlashCommandBuilder;
            /**
             * Function run when this command is called
             */
            execute: (
                interaction: ChatInputCommandInteraction,
                client?: Client
            ) => void;
            /**
             * Permission required by the user to proceed with the command
             */
            permissionsRequired?: PermissionFlags[];
            /**
             * Permission required by the bot to proceed with the command
             */
            botPermissions?: PermissionFlags[];
            /**
             * Whether the command is deleted or not
             */
            deleted?: boolean;
        },
        ...interaction: CommandInteractionObject[]
    );
    constructor(
        commandObject:
            | {
                  name: string;
                  description: string;
                  callback: (
                      client: Client,
                      interaction: ChatInputCommandInteraction
                  ) => void;
                  options?: Option[];
                  permissionsRequired?: PermissionFlags[];
                  botPermissions?: PermissionFlags[];
                  deleted?: boolean;
              }
            | {
                  data: SlashCommandBuilder;
                  execute: (
                      interaction: ChatInputCommandInteraction,
                      client?: Client
                  ) => void;
                  permissionsRequired?: PermissionFlags[];
                  botPermissions?: PermissionFlags[];
                  deleted?: boolean;
              },
        ...interaction: CommandInteractionObject[]
    ) {
        if ("data" in commandObject) {
            this.name = commandObject.data.name;
            this.description = commandObject.data.description;
            this.options =
                commandObject.data.options.map((option) => option.toJSON()) ||
                [];
            this.callback = function command(
                client: Client,
                interaction: ChatInputCommandInteraction
            ) {
                commandObject.execute(interaction, client);
            };
        } else {
            this.name = commandObject.name;
            this.description = commandObject.description;
            this.options = commandObject.options || [];
            this.callback = commandObject.callback;
        }
        this.permissionsRequired =
            commandObject.permissionsRequired !== undefined
                ? commandObject.permissionsRequired
                : [];
        this.botPermissions =
            commandObject.botPermissions !== undefined
                ? commandObject.botPermissions
                : [];
        this.deleted =
            commandObject.deleted !== undefined ? commandObject.deleted : false;

        for (const inter of interaction) {
            if (!this.interactions[inter.type]) {
                this.interactions[inter.type] = {};
            }
            this.interactions[inter.type]![inter.customId] = inter;
        }
    }
}
