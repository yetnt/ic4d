import { CoreHandler, Option } from "./coreHandler";
import { Client, Interaction, PermissionFlags } from "discord.js";
//@ts-ignore
import * as clc from "cli-color";

interface LoaderOptions {
    loaded: string;
    edited: string;
    deleted: string;
    skipped: string;
}

interface ReaderOptions {
    testGuildId?: string;
    devs: string[];

    onlyDev?: string;
    botNoPerms?: string;
    userNoPerms?: string;
}

export interface CommandObject {
    name: string;
    description: string;
    callback: (client: Client, interaction: Interaction) => void;
    options?: Option[];
    deleted?: boolean;
    devOnly?: boolean;

    permissionsRequired?: PermissionFlags[];
    botPermissions?: PermissionFlags[];
}

/**
 * @class
 * Command Handler which loads, edits and deletes slash commands for you.
 */
export class CommandHandler extends CoreHandler {
    client: Client;
    commandPath: string;
    options: LoaderOptions = {
        loaded: "NAME has been registered successfully.",
        edited: "NAME has been edited.",
        deleted: "NAME has been deleted.",
        skipped: "NAME was skipped. (Command deleted or set to delete.)",
    };
    readerOptions: ReaderOptions | undefined = {
        testGuildId: undefined,
        devs: [],
        onlyDev: "Only developers are allowed to run this command.",
        userNoPerms: "Not enough permissions.",
        botNoPerms: "I don't have enough permissions.",
    };

    /**
     *
     * @param client Discord.js Client
     * @param path Path to Slash Commands
     * @param readerOptions Command Reader Options
     * @param loaderOptions Command Loader Options
     */
    constructor(
        client: Client,
        path: string,
        readerOptions?: ReaderOptions,
        loaderOptions?: LoaderOptions
    ) {
        super(client);
        this.commandPath = path;

        this.options = {
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
    }

    /**
     * Register Slash Commands
     * @param serverId Server Id, Makes loaded command guild wide.
     */
    async registerCommands(serverId?: string) {
        try {
            const localCommands = this.getLocalCommands(this.commandPath);
            const applicationCommands = await this.getApplicationCommands(
                this.client,
                serverId
            );

            for (const localCommand of localCommands) {
                const { name, description, options } = localCommand;

                const existingCommand = await applicationCommands.cache.find(
                    (cmd) => cmd.name === name
                );

                if (existingCommand) {
                    if (localCommand.deleted) {
                        await applicationCommands.delete(existingCommand.id);
                        console.log(this.options.deleted.replace("NAME", name));
                        continue;
                    }

                    if (
                        this.areCommandsDifferent(existingCommand, localCommand)
                    ) {
                        await applicationCommands.edit(existingCommand.id, {
                            description,
                            options,
                        });

                        console.log(this.options.edited.replace("NAME", name));
                    }
                } else {
                    if (localCommand.deleted) {
                        console.log(this.options.skipped.replace("NAME", name));
                        continue;
                    }

                    await applicationCommands.create({
                        name,
                        description,
                        options,
                    });

                    console.log(this.options.loaded.replace("NAME", name));
                }
            }
        } catch (error) {
            throw new Error("Failed loading command.\n\n" + error);
        }
    }

    /**
     * Handle Slash Commands
     * @param middleWare Functions to be run before running a command.
     */
    async handleCommands(
        ...middleWare: ((
            commandObject: CommandObject,
            interaction?: Interaction
        ) => number)[]
    ) {
        this.client.on(
            "interactionCreate",
            async (interaction: Interaction) => {
                if (!interaction.isChatInputCommand()) return;

                const localCommands = this.getLocalCommands(this.commandPath);

                try {
                    const commandObject: CommandObject = localCommands.find(
                        (cmd: any) => cmd.name === interaction.commandName
                    );

                    if (!commandObject) return;

                    if (commandObject.devOnly) {
                        if (
                            //@ts-ignore
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
                    throw new Error("Failed to run command!\n\n" + error);
                }
            }
        );
    }
}
