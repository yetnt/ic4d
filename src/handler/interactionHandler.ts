import { CoreHandler } from "./coreHandler";
import {
    Client,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    Interaction,
    ModalSubmitInteraction,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    ButtonInteraction,
    AnySelectMenuInteraction,
} from "discord.js";
import * as clc from "cli-color";
import * as errs from "./Errors";
import {
    InteractionObject,
    ContextMenuObject,
    LoaderOptions,
    InteractionHandlerFlags,
    CommandObject,
    HandlerVariables,
} from "./interfaces";

/**
 * @class
 * Handle Interactions. (Slash commands not included. Use CommandHandler() for slash).
 */
export class InteractionHandler extends CoreHandler {
    interactionsPath: string;
    interactions: {
        buttons: Record<string, InteractionObject>;
        selectMenus: Record<string, InteractionObject>;
        contextMenus: Record<string, ContextMenuObject>;
        modals: Record<string, InteractionObject>;
    };
    variables: HandlerVariables.Type = {};
    options: LoaderOptions = {
        loadedNoChanges: "NAME was loaded. No changes were made.",
        loaded: "NAME has been registered successfully.",
        edited: "NAME has been edited.",
        deleted: "NAME has been deleted.",
        skipped: "NAME was skipped. (Command deleted or set to delete.)",
    };
    flags: InteractionHandlerFlags = {
        debugger: false,
        disableLogs: false,
        refreshContextMenus: false,
    };

    /**
     *
     * @param client Discord.js Client
     * @param path Path to where the interaction objects are stored
     * @param loaderOptions Loader options (for context menus)
     */
    constructor(
        client: Client,
        path: string,
        loaderOptions?: LoaderOptions,
        flags?: InteractionHandlerFlags
    ) {
        super("iHandler", client, flags.debugger, flags.logToFile);
        this.interactionsPath = path;
        const interactions = this.getInteractions(this.interactionsPath);
        this.interactions = this.sortInteractionObjects(interactions);

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

        this.flags = {
            debugger: flags?.debugger || this.flags.debugger,
            disableLogs: flags?.disableLogs || this.flags.disableLogs,
            logToFile: flags?.logToFile || this.flags.logToFile,
            refreshContextMenus:
                flags?.refreshContextMenus || this.flags.refreshContextMenus,
        };

        client.on(
            HandlerVariables.Events.ADD_VARIABLE,
            async (
                interaction: ChatInputCommandInteraction,
                commandObject: CommandObject,
                k: { [key: string]: any }
            ) => {
                this.debug.commonBlue(`interaction variable(s) received:`);
                this.debug.commonBlue(k.toString());
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

                    this.variables[id] = k;
                } catch (error) {
                    let err = new errs.InteractionHandler(
                        undefined,
                        "Loading interactions variables sent from $NAME$ failed with the error:\n\n",
                        undefined,
                        interaction.commandName
                    );
                    console.error(error);

                    throw err;
                }
            }
        );
    }

    private async findVariable(
        interaction:
            | ButtonInteraction
            | AnySelectMenuInteraction
            | ModalSubmitInteraction,
        customId: string
    ) {
        // Use `find` instead of `filter`
        const varEntry = Object.entries(this.variables).find(async ([key]) => {
            const [interactionIds, messageId] = key.split(
                HandlerVariables.Separators.DEFAULT
            );
            const interactionMessageId = await interaction
                .fetchReply()
                .then((d) => d.id);

            return (
                interactionIds
                    .split(HandlerVariables.Separators.INTERACTION_IDS)
                    .includes(customId) && messageId === interactionMessageId
            );
        });

        // Return the variable if found, otherwise undefined
        return varEntry ? varEntry[1] : undefined;
    }

    private sortInteractionObjects(
        interactions: (ContextMenuObject | InteractionObject)[]
    ): {
        buttons: Record<string, InteractionObject>;
        selectMenus: Record<string, InteractionObject>;
        contextMenus: Record<string, ContextMenuObject>;
        modals: Record<string, InteractionObject>;
    } {
        const buttons = interactions
            .filter((obj) => obj.type === "button")
            .reduce<Record<string, InteractionObject>>(
                (acc, obj: InteractionObject) => {
                    acc[obj.customId] = {
                        callback: obj.callback,
                        onlyAuthor: obj.onlyAuthor,
                        filePath: obj.filePath,
                        type: obj.type,
                        timeout: obj.timeout,
                        onTimeout: obj.onTimeout,
                    };
                    return acc;
                },
                {}
            );

        const selectMenus = interactions
            .filter((obj) => obj.type === "selectMenu")
            .reduce<Record<string, InteractionObject>>(
                (acc, obj: InteractionObject) => {
                    acc[obj.customId] = {
                        callback: obj.callback,
                        onlyAuthor: obj.onlyAuthor,
                        filePath: obj.filePath,
                        type: obj.type,
                        timeout: obj.timeout,
                        onTimeout: obj.onTimeout,
                    };
                    return acc;
                },
                {}
            );

        const contextMenus = this.getInteractions(this.interactionsPath, true)
            .filter((obj) => typeof obj.type === "number") // if the type property is a number, then we know damn well it's a context menu. If not you're fucking yourself over.
            .reduce<Record<string, ContextMenuObject>>(
                (acc, obj: ContextMenuObject) => {
                    acc[obj.name] = {
                        name: obj.name,
                        type: obj.type,
                        data: obj.data,
                        filePath: obj.filePath,
                        callback: obj.callback,
                    };
                    return acc;
                },
                {}
            );

        const modals = interactions
            .filter((obj) => obj.type === "modal")
            .reduce<Record<string, InteractionObject>>(
                (acc, obj: InteractionObject) => {
                    acc[obj.customId] = {
                        callback: obj.callback,
                        filePath: obj.filePath,
                        type: obj.type,
                    };
                    return acc;
                },
                {}
            );

        return { buttons, selectMenus, contextMenus, modals };
    }

    /**
     * Start listening for buttons.
     * @param authorOnlyMsg Message to be displayed when a different user clicks an author only button.
     * @param middleWare Functions to run before the buttons execute.
     */
    buttons(
        authorOnlyMsg: string,
        ...middleWare: ((interaction?: Interaction) => number)[]
    ) {
        if (this.flags.debugger) this.debug.topMsg("buttons()");
        authorOnlyMsg =
            authorOnlyMsg !== undefined
                ? authorOnlyMsg
                : "This button is not for you";
        this.client.on(
            "interactionCreate",
            async (interaction: ButtonInteraction) => {
                if (!interaction.isButton()) return;
                const buttonObj =
                    this.interactions.buttons[interaction.customId];

                try {
                    if (buttonObj == undefined) return; // for buttons that don't need this package to respond to them.

                    const author = interaction.message.interaction.user.id;
                    const buttonClicker = interaction.member.user.id;

                    if (
                        buttonObj.onlyAuthor == true &&
                        author !== buttonClicker
                    ) {
                        interaction.reply({
                            content: authorOnlyMsg,
                            ephemeral: true,
                        });
                        return;
                    }

                    for (const fn of middleWare) {
                        let result = fn(interaction);
                        if (result == 1) return; // test condition is true
                    }
                    console.log(this.variables);
                    buttonObj.callback(
                        interaction,
                        this.client,
                        await this.findVariable(interaction, buttonObj.customId)
                    );
                } catch (error) {
                    let err = new errs.ButtonError(
                        "Button $NAME$ failed with the error:\n\n" + error,
                        buttonObj.filePath,
                        interaction.customId
                    );

                    throw err;
                }
            }
        );
    }

    /**
     * Start listening for select menus (supports all types)
     * @param authorOnlyMsg Message to be displayed when a different user clicks an author only button.
     * @param middleWare Functions to run before the selectMenus execute.
     */
    selectMenus(
        authorOnlyMsg?: string,
        ...middleWare: ((interaction?: Interaction) => number)[]
    ) {
        if (this.flags.debugger) this.debug.topMsg("selectMenus()");
        authorOnlyMsg =
            authorOnlyMsg !== undefined
                ? authorOnlyMsg
                : "This select menu is not for you";
        this.client.on(
            "interactionCreate",
            async (interaction: AnySelectMenuInteraction) => {
                if (!interaction.isAnySelectMenu()) return;
                const selectObj =
                    this.interactions.selectMenus[interaction.customId];

                try {
                    if (selectObj == undefined) return; // for selects that don't need this package to respond to them.

                    const author = interaction.message.interaction.user.id;
                    const selectMenuClicker = interaction.member.user.id;

                    if (
                        selectObj.onlyAuthor == true &&
                        author !== selectMenuClicker
                    ) {
                        interaction.reply({
                            content: authorOnlyMsg,
                            ephemeral: true,
                        });
                        return;
                    }

                    for (const fn of middleWare) {
                        let result = fn(interaction);
                        if (result == 1) return; // test condition is true
                    }
                    selectObj.callback(
                        interaction,
                        this.client,
                        await this.findVariable(interaction, selectObj.customId)
                    );
                } catch (error) {
                    let err = new errs.ButtonError(
                        "Select Menu $NAME$ failed with the error:\n\n" + error,
                        selectObj.filePath,
                        interaction.customId
                    );

                    throw err;
                }
            }
        );
    }

    /**
     * Start listening for context menus (supports all types)
     * @param middleWare Functions to run before the buttons contextMenus execute.
     */
    contextMenus(...middleWare: ((interaction?: Interaction) => number)[]) {
        if (this.flags.debugger) this.debug.topMsg("contextMenus()");
        this.client.on(
            "interactionCreate",
            async (
                interaction:
                    | UserContextMenuCommandInteraction
                    | MessageContextMenuCommandInteraction
            ) => {
                if (!interaction.isContextMenuCommand()) return;
                const contextObj =
                    this.interactions.contextMenus[interaction.commandName];

                try {
                    if (contextObj == undefined) return;
                    for (const fn of middleWare) {
                        let result = fn(interaction);
                        if (result == 1) return; // test condition is true
                    }
                    contextObj.callback(interaction, this.client);
                } catch (error) {
                    let err = new errs.ContextHandlerError(
                        "Context Menu $NAME$ failed with the error:\n\n" +
                            error,
                        contextObj.filePath,
                        interaction.commandName
                    );

                    throw err;
                }
            }
        );
    }

    /**
     * Start listening for modals
     * @param middleWare Functions to run before the modals execute.
     */
    modals(...middleWare: ((interaction?: Interaction) => number)[]) {
        if (this.flags.debugger) this.debug.topMsg("modals()");
        this.client.on(
            "interactionCreate",
            async (interaction: ModalSubmitInteraction) => {
                if (!interaction.isModalSubmit()) return;
                const modalObj = this.interactions.modals[interaction.customId];

                try {
                    if (modalObj == undefined) return;
                    for (const fn of middleWare) {
                        let result = fn(interaction);
                        if (result == 1) return; // test condition is true
                    }
                    modalObj.callback(
                        interaction,
                        this.client,
                        await this.findVariable(interaction, modalObj.customId)
                    );
                } catch (error) {
                    let err = new errs.ModalError(
                        "Modal $NAME$ failed with the error:\n\n" + error,
                        modalObj.filePath,
                        interaction.customId
                    );

                    throw err;
                }
            }
        );
    }

    /**
     * Start listening for Select Menus, Context Menus and Buttons
     * @param authorOnlyMsg Message to be displayed when a different user clicks an author only button.
     * @param middleWare Functions to run before the every interaction executes..
     */
    start(
        authorOnlyMsg?: string,
        ...middleWare: ((interaction?: Interaction) => 1 | number)[]
    ) {
        this.buttons(authorOnlyMsg, ...middleWare);
        this.selectMenus(authorOnlyMsg, ...middleWare);
        this.contextMenus(...middleWare);
        this.modals(...middleWare);
    }

    /**
     * Register Context Menus
     * @param logAll log even when a context menu gets loaded but doesn't change
     * @param serverId Server Id, Makes loaded command guild wide.
     */
    async registerContextMenus(logAll?: boolean, serverId?: string) {
        logAll = logAll !== undefined ? logAll : true;
        try {
            const localContexts = this.getInteractions(
                this.interactionsPath,
                true
            );
            const applicationCommands = await this.getApplicationCommands(
                this.client,
                serverId
            );

            if (this.flags.refreshContextMenus) {
                let count = 0;
                applicationCommands.cache.forEach((v, k, m) => {
                    if (
                        v.type !== ApplicationCommandType.Message &&
                        v.type !== ApplicationCommandType.User
                    )
                        return;
                    if (this.flags.debugger)
                        console.log(clc.red.underline(`${v.name}, `));
                    applicationCommands.delete(v.id);
                });
                if (this.flags.debugger)
                    console.log(clc.red.underline("have been deleted."));

                console.log(
                    clc.yellow.underline.italic(
                        `${count} application commands (Context Menus) have been deleted.`
                    )
                );
            }

            for (const localContext of localContexts as ContextMenuObject[]) {
                let noChanges = true;
                let { name, type, filePath, data } = localContext;
                try {
                    const existingContext =
                        await applicationCommands.cache.find(
                            (con) => con.name === name
                        );

                    if (existingContext) {
                        if (localContext.deleted) {
                            await applicationCommands.delete(
                                existingContext.id
                            );
                            noChanges = false;
                            if (!this.flags.disableLogs)
                                console.log(
                                    this.options.deleted.replace("NAME", name)
                                );
                            continue;
                        }

                        if (
                            this.areContextMenusDifferent(
                                //@ts-ignore
                                existingContext,
                                localContext
                            )
                        ) {
                            await applicationCommands.edit(
                                existingContext.id,
                                data
                            );
                            noChanges = false;

                            if (!this.flags.disableLogs)
                                console.log(
                                    this.options.edited.replace("NAME", name)
                                );
                        }
                    } else {
                        if (localContext.deleted) {
                            noChanges = false;
                            if (!this.flags.disableLogs)
                                console.log(
                                    this.options.skipped.replace("NAME", name)
                                );
                            continue;
                        }

                        data ||= {
                            name,
                            type,
                        };

                        await applicationCommands.create(data);
                        noChanges = false;

                        if (!this.flags.disableLogs)
                            console.log(
                                this.options.loaded.replace("NAME", name)
                            );
                    }
                } catch (err) {
                    throw new errs.ContextLoaderError(
                        `Command $NAMECONTEXT$ from $PATH$:` + err,
                        filePath,
                        name
                    );
                }

                if (logAll && noChanges == true && !this.flags.disableLogs) {
                    console.log(
                        this.options.loadedNoChanges.replace("NAME", name)
                    );
                }
            }
        } catch (error) {
            let msg = "Loading context menus failed with the error: ";
            let Lmsg =
                error instanceof errs.ContextLoaderError
                    ? `${clc.bold("(" + error.name + ")")} ` +
                      msg +
                      error.message
                    : msg;

            throw new Error(Lmsg);
        }
    }
}
