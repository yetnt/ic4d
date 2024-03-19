import {
    Interaction,
    Client,
    PermissionFlags,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
} from "discord.js";
import { Option } from "./coreHandler";

export enum InteractionType {
    selectMenu = "selectMenu",
    modal = "modal",
    button = "button",
}

/**
 * @class
 * Represents an interaction object.
 */
export class CommandInteractionObject {
    /**
     * Function run when this interaction is called.
     * @param interaction Interaction
     * @param client Client
     */
    callback: (interaction: Interaction, client?: Client) => void;
    /**
     * The interaction's custom identifier
     */
    customId: string;
    /**
     * Type of interaction. Either "selectMenu", "modal" or "button"
     */
    type: InteractionType;
    /**
     * Set the only author status of the button.
     */
    onlyAuthor: boolean;
    /**
     * Path to which this interaction is located
     */
    filePath: string;
    /**
     * Time out (Select menu and Button) after given MILLISECONDS
     */
    timeout?: number;
    /**
     * Function to run when interaction times out. If this is set, timeoutMsg property is ignored.
     */
    onTimeout?: (interaction: Interaction, client?: Client) => void;
    /**
     * Build the actual interaction
     * @param intObject Interaction Object (see github) with properties
     */
    constructor(intObject: {
        /**
         * Type of interaction. Either "selectMenu", "modal" or "button"
         */
        type: InteractionType;
        /**
         * The interaction's custom identifier
         */
        customId: string;
        /**
         * Function run when this interaction is called.
         * @param interaction Interaction. (Interacton given by the "InteractionCreate" event listener.)
         * @param client Client
         */
        callback: (interaction: Interaction, client?: Client) => void;
        /**
         * Set the only author status of the button. (The correct property is onlyAuthor, but this is for yall who also accidenatally type this)
         */
        authorOnly?: boolean;
        /**
         * Set the only author status of the button.
         */
        onlyAuthor?: boolean;
        /**
         * Time out (Select menu and Button) after given MILLISECONDS
         */
        timeout?: number;
        /**
         * @deprecated Timeout message is deprecated and will no longer work. use `onTimeout` function instead.
         * Message to display when interaction times out.
         */
        timeoutMsg?: string;
        /**
         * Function to run when interaction times out. If this is set, timeoutMsg property is ignored.
         */
        onTimeout?: (interaction: Interaction, client?: Client) => void;
    }) {
        this.customId = intObject.customId;
        this.type = intObject.type;
        this.callback = intObject.callback;
        this.onlyAuthor =
            intObject.authorOnly !== undefined
                ? intObject.authorOnly
                : intObject.onlyAuthor !== undefined
                ? intObject.onlyAuthor
                : false;
        this.timeout = intObject.timeout !== undefined ? intObject.timeout : 0;
        this.onTimeout = intObject.onTimeout || undefined;
    }
}

export type Interactions = {
    [key in InteractionType]?: {
        [key: string]: CommandInteractionObject;
    };
};

/**
 * Represents a slash command
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
