import {
    AnySelectMenuInteraction,
    ApplicationCommandOptionType,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    Interaction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RESTPostAPIApplicationCommandsJSONBody,
    UserContextMenuCommandInteraction,
} from "discord.js";
import { Interactions } from "./builders/SlashCommandManager";

// Interfaces used by the package.

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
/**
 * An interface representing a command that has been sanitized to work with the ic4d package. You should probably not touch this 💀
 */
export interface CommandObject {
    name: string;
    description: string;
    data?: RESTPostAPIApplicationCommandsJSONBody;
    callback: (
        client: Client,
        interaction: ChatInputCommandInteraction
    ) => void | Promise<void>;
    options?: Option[];
    deleted?: boolean;
    devOnly?: boolean;
    filePath?: string;
    isOld?: boolean;
    isDev?: boolean;
    interactions: Interactions;

    permissionsRequired?: bigint[];
    botPermissions?: bigint[];
}
export interface InteractionObject {
    customId?: string;
    onlyAuthor?: boolean;
    authorOnly?: boolean;
    filePath: string;
    type: string;
    timeout?: number;
    callback: (
        interaction:
            | ButtonInteraction
            | AnySelectMenuInteraction
            | UserContextMenuCommandInteraction
            | MessageContextMenuCommandInteraction
            | ModalSubmitInteraction,
        client?: Client
    ) => void;
    onTimeout?: (interaction: Interaction, client?: Client) => void;
}
export interface ContextMenuObject {
    name: string;
    type: number;
    deleted?: boolean;
    filePath?: string;
    data: RESTPostAPIApplicationCommandsJSONBody;
    callback: (
        interaction:
            | UserContextMenuCommandInteraction
            | MessageContextMenuCommandInteraction,
        client?: Client
    ) => void;
}

// Exported interfaces and used by package too

/**
 * An interface representing the configuration flags used for running commands in the bot.
 * This configuration is specifically used to control various runtime aspects of command execution.
 *
 * @see HandlerFlags for flags related to the command handling and execution process before the code runs.
 */
export interface RunFlags {
    /**
     * The ID of the test guild for command testing purposes. If provided, commands will be deployed only to this guild.
     *
     * @example "123456789012345678"
     */
    testGuildId?: string;

    /**
     * An array of Discord user IDs (snowflakes) that have developer privileges.
     * Commands or functionalities restricted to developers will be accessible to users with IDs in this array.
     *
     * @example ["123456789012345678", "876543210987654321"]
     */
    devs: string[];

    /**
     * The message shown when a command restricted to developers is executed by a non-developer.
     */
    onlyDev?: string;

    /**
     * The message displayed when the bot lacks the necessary permissions to execute a command.
     */
    botNoPerms?: string;

    /**
     * The message displayed when a user lacks the necessary permissions to execute a command.
     */
    userNoPerms?: string;
}

/**
 * An interface that represents anything you can do with the commands when they are run, BUT before YOUR code executes.
 */
export interface HandlerFlags {
    /**
     * Enable Debugger mode. Prints (almost) everything that happens behind the scenes of course not with the API itself.
     */
    debugger?: boolean;
    /**
     * Disabling Logging of the Command Loader. Not advised but hey it's your bot. Default is false.
     */
    disableLogs?: boolean;
    /**
     * Enable this if you're using typescript, Allows for es imports.
     */
    esImports?: boolean;
    /**
     * If you're using esImports, and you leave this at it's default (false), then if a file ion the commands folder does not export a SlashCommandManager class as one of the exports, an error will be thrown.
     */
    esImportsDisableNoExportFound?: boolean;
    /**
     * Whether or not this is the production version of the bot. If set to true, commands labelled `isDev` will NOT be loaded. (Use the `setDev()` method in  @see SlashCommandManager
     */
    production?: boolean;
    /**
     * Clears ALL application commands on startup. (Slash commands, User commands, and Message commands.)
     */
    refreshApplicationCommands?: boolean;
}

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
