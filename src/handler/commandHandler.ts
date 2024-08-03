import { CoreHandler, Option } from "./coreHandler";
import {
    ChatInputCommandInteraction,
    Client,
    Interaction,
    PermissionFlags,
    RESTPostAPIApplicationCommandsJSONBody,
    SlashCommandBuilder,
} from "discord.js";
import * as clc from "cli-color";
import * as errs from "./Errors";
import { LoaderOptions } from "./coreHandler";
import { deprecated } from "../funcs";

interface ReaderOptions {
    /**
     * Test GuildID
     */
    testGuildId?: string;
    /**
     * Array of discord snowflakes
     */
    devs: string[];

    /**
     * String to show when an only dev command is run
     */
    onlyDev?: string;
    /**
     * String to show when the bot does not have enough permissions
     */
    botNoPerms?: string;
    /**
     * String to show when the user does not have enough permissions
     */
    userNoPerms?: string;
}

export interface CommandObject {
    name: string;
    description: string;
    data?: RESTPostAPIApplicationCommandsJSONBody;
    callback: (
        client: Client,
        interaction: ChatInputCommandInteraction
    ) => void;
    options?: Option[];
    deleted?: boolean;
    devOnly?: boolean;
    filePath?: string;
    isOld?: boolean;

    permissionsRequired?: PermissionFlags[];
    botPermissions?: PermissionFlags[];
}

/**
 * An interface that represents anything you can do with the commands when they are run, BUT before YOUR code executes.
 */
export interface InjectionOptions {
    /**
     * Enable Debugger mode.
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
     * If you're using esImports, and you leave this at it's default (true), then if a file ion the commands folder does not export a SlashCommandManager class as one of the exports, an error will be thrown.
     */
    esImportsDisableNoExportFound?: boolean;
}

/**
 * @class
 * Command Handler which loads, edits and deletes slash commands for you.
 */
export class CommandHandler extends CoreHandler {
    client: Client;
    commandPath: string;
    options: LoaderOptions = {
        loadedNoChanges: "NAME was loaded. No changes were made.",
        loaded: "NAME has been registered successfully.",
        edited: "NAME has been edited.",
        deleted: "NAME has been deleted.",
        skipped: "NAME was skipped. (Command deleted or set to delete.)",
    };
    readerOptions: ReaderOptions = {
        testGuildId: undefined,
        devs: [],
        onlyDev: "Only developers are allowed to run this command.",
        userNoPerms: "Not enough permissions.",
        botNoPerms: "I don't have enough permissions.",
    };
    iOptions: InjectionOptions = {
        debugger: false,
        disableLogs: false,
        esImports: false,
        esImportsDisableNoExportFound: false,
    };

    /**
     *
     * @param client Discord.js Client
     * @param path Path to Slash Commands
     * @param readerOptions Command Reader Options
     * @param loaderOptions Command Loader Options
     * @param injectionOptions Injection Options.
     */
    constructor(
        client: Client,
        path: string,
        readerOptions?: ReaderOptions,
        loaderOptions?: LoaderOptions,
        injectionOptions?: InjectionOptions
    ) {
        super(client);
        this.commandPath = path;

        this.options = {
            loadedNoChanges: clc.magenta.bold(
                loaderOptions?.loadedNoChanges || this.options.loadedNoChanges
            ),
            loaded: clc.green.bold(
                loaderOptions?.loaded || this.options.loaded
            ),
            edited: clc.yellow.bold(
                loaderOptions?.edited || this.options.edited
            ),
            deleted: clc.red.bold(
                loaderOptions?.deleted || this.options.deleted
            ),
            skipped: clc.cyan.bold(
                loaderOptions?.skipped || this.options.skipped
            ),
        };

        this.readerOptions = {
            testGuildId: readerOptions?.testGuildId || undefined,
            devs: readerOptions?.devs || [],
            onlyDev: readerOptions?.onlyDev || this.readerOptions.onlyDev,
            userNoPerms:
                readerOptions?.userNoPerms || this.readerOptions.userNoPerms,
            botNoPerms:
                readerOptions?.botNoPerms || this.readerOptions.botNoPerms,
        };

        this.iOptions = {
            debugger: injectionOptions?.debugger || false,
            disableLogs: injectionOptions?.disableLogs || false,
            esImports: injectionOptions?.esImports || false,
            esImportsDisableNoExportFound:
                injectionOptions?.esImportsDisableNoExportFound || false,
        };
    }

    /**
     * Register Slash Commands
     * @param logAll Log when loading a command and no changes are made
     * @param serverId Server Id, Makes loaded commands guild wide.
     */
    async registerCommands(logAll?: boolean, serverId?: string) {
        logAll = logAll !== undefined ? logAll : true;
        try {
            const localCommands = this.getLocalCommands(this.commandPath);
            const applicationCommands = await this.getApplicationCommands(
                this.client,
                serverId
            );

            for (const localCommand of localCommands) {
                let noChanges = true;
                if (
                    !localCommand.name ||
                    !localCommand.description ||
                    !localCommand.callback
                ) {
                    throw new errs.LoaderError(
                        `Command $PATH$ does not export required properties: name, description or callback`,
                        localCommand.filePath
                    );
                }
                let { name, filePath, isOld, data } = localCommand;
                try {
                    const existingCommand =
                        await applicationCommands.cache.find(
                            (cmd) => cmd.name === name
                        );

                    if (existingCommand) {
                        if (localCommand.deleted) {
                            // Delete Command
                            await applicationCommands.delete(
                                existingCommand.id
                            );
                            noChanges = false;
                            if (!this.iOptions.disableLogs)
                                console.log(
                                    this.options.deleted.replace("NAME", name)
                                );
                            continue;
                        }

                        if (
                            this.areCommandsDifferent(
                                existingCommand,
                                localCommand
                            )
                        ) {
                            // Command was edited.
                            await applicationCommands.edit(
                                existingCommand.id,
                                // @ts-ignore
                                data
                            );
                            noChanges = false;

                            if (!this.iOptions.disableLogs)
                                console.log(
                                    deprecated(
                                        this.options.edited.replace(
                                            "NAME",
                                            name
                                        ),
                                        isOld
                                    )
                                );
                        }
                    } else {
                        if (localCommand.deleted) {
                            // Command was previously deleted
                            noChanges = false;
                            if (!this.iOptions.disableLogs)
                                console.log(
                                    deprecated(
                                        this.options.skipped.replace(
                                            "NAME",
                                            name
                                        ),
                                        isOld
                                    )
                                );
                            continue;
                        }

                        // Create new command.

                        // data ||= {
                        //     name,
                        //     description,
                        //     // @ts-ignore
                        //     options,
                        // };

                        await applicationCommands.create(data);
                        noChanges = false;

                        if (!this.iOptions.disableLogs)
                            console.log(
                                deprecated(
                                    this.options.loaded.replace("NAME", name),
                                    isOld
                                )
                            );
                    }
                } catch (err) {
                    throw new errs.LoaderError(
                        `Command $NAME$ from $PATH$:` + err,
                        filePath,
                        name
                    );
                }

                if (logAll && noChanges == true) {
                    if (!this.iOptions.disableLogs)
                        console.log(
                            deprecated(
                                this.options.loadedNoChanges.replace(
                                    "NAME",
                                    name
                                ),
                                isOld
                            )
                        );
                }
            }
        } catch (error) {
            let msg = "Loading commands failed with the error: ";
            let Lerr =
                error instanceof errs.LoaderError
                    ? `${clc.bold("(" + error.name + ")")} ` +
                      msg +
                      error.message
                    : msg;

            throw new Error(Lerr);
        }
    }

    /**
     * Handle Slash Commands
     * @param middleWare Functions to be run before running a command.
     */
    async handleCommands(
        ...middleWare: ((
            commandObject: CommandObject,
            interaction?: ChatInputCommandInteraction
        ) => number | Promise<number>)[]
    ) {
        this.client.on(
            "interactionCreate",
            async (interaction: ChatInputCommandInteraction) => {
                if (!interaction.isChatInputCommand()) return;

                const localCommands = this.getLocalCommands(this.commandPath);

                const commandObject: CommandObject = localCommands.find(
                    (cmd: CommandObject) => cmd.name === interaction.commandName
                );

                try {
                    if (!commandObject) return;

                    if (commandObject.devOnly) {
                        if (
                            !this.readerOptions.devs.includes(
                                interaction.user.id
                            )
                        ) {
                            interaction.reply({
                                content: this.readerOptions.onlyDev,
                                ephemeral: true,
                            });
                            return;
                        }
                    }

                    if (commandObject.permissionsRequired?.length) {
                        for (const permission of commandObject.permissionsRequired) {
                            if (
                                //@ts-ignore
                                !interaction.member.permissions.has(permission)
                            ) {
                                interaction.reply({
                                    content: this.readerOptions.userNoPerms,
                                    ephemeral: true,
                                });
                                return;
                            }
                        }
                    }

                    if (commandObject.botPermissions?.length) {
                        for (const permission of commandObject.botPermissions) {
                            const bot = interaction.guild.members.me;
                            //@ts-ignore
                            if (!bot.permissions.has(permission)) {
                                interaction.reply({
                                    content: this.readerOptions.botNoPerms,
                                    ephemeral: true,
                                });
                                return;
                            }
                        }
                    }

                    for (const fn of middleWare) {
                        let result = await fn(commandObject, interaction);
                        if (result == 1) return; // test condition is true
                    }

                    await commandObject.callback(this.client, interaction);
                } catch (error) {
                    let err = new errs.HandlerError(
                        `Failed to run command $NAME$ \n\n` + error,
                        commandObject.filePath,
                        commandObject.name
                    );
                    console.error(error);
                    throw err;
                }
            }
        );
    }
}
