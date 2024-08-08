import {
    Client,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import { Option } from "../coreHandler";
import { InteractionTypeStrings, InteractionBuilder } from "./builders";

export type Interactions = {
    [key in InteractionTypeStrings]?: {
        [key: string]: InteractionBuilder;
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
    ) => void | Promise<void>;
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
     * Whether or not this command can only be found in the development release.
     * To have dev commands disabled, enable `production` property in the CommandHandler HandlerFlags parameter
     */
    isDev: boolean = false;

    constructor(commandObject: {
        /**
         * Slash Command Data
         */
        data: SlashCommandBuilder;
        /**
         * Function to run when this command is called.
         * @param interaction Interaction associated with the command
         * @param client Bot's client object.
         */
        execute: (
            interaction: ChatInputCommandInteraction,
            client?: Client
        ) => void | Promise<void>;
    }) {
        this.data = commandObject.data.toJSON();
        this.name = commandObject.data.name;
        this.description = commandObject.data.description;
        this.options =
            commandObject.data.options.map((option) => option.toJSON()) || [];
        this.callback = async function command(
            client: Client,
            interaction: ChatInputCommandInteraction
        ) {
            await commandObject.execute(interaction, client);
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
     * Set whether or not this command is only available in the developer release of said bot.
     * @param bool If true, command is marked as developer.
     */
    setDev(bool: boolean): SlashCommandManager {
        this.isDev = bool;
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
