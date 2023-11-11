import { CoreHandler } from "./coreHandler";
import {
    Client,
    Interaction,
    ButtonInteraction,
    StringSelectMenuInteraction,
} from "discord.js";
import { InteractionButtonError } from "./Errors";

export interface InteractionObject {
    customId?: string;
    description?: string;
    onlyAuthor?: boolean;
    filePath: string;
    callback: (
        interaction: ButtonInteraction | StringSelectMenuInteraction,
        client?: Client
    ) => void;
}

/**
 * @class
 * Handle Interactions. (Slash commands not included. Use CommandHandler() for slash).
 */
export class InteractionHandler extends CoreHandler {
    interactionsPath: string;
    interactions: Record<string, InteractionObject>;
    logErrors: boolean = false;

    /**
     *
     * @param client Discord.js Client
     * @param path Path to where the interaction objects are stored
     * @param logErrors Log any occuring errors
     */
    constructor(client: Client, path: string, logErrors?: boolean) {
        super(client);
        this.interactionsPath = path;
        const interactions = this.getInteractions(this.interactionsPath);
        this.interactions = interactions.reduce<
            Record<string, InteractionObject>
        >((acc, obj) => {
            acc[obj.customId] = {
                callback: obj.callback,
                onlyAuthor: obj.onlyAuthor,
                filePath: obj.filePath,
            };
            return acc;
        }, {});
        this.logErrors = logErrors == true ? true : false;
    }

    /**
     * Start listening for buttons.
     * @param authorOnlyMsg Message to be displayed when a different user clicks an author only button.
     */
    buttons(authorOnlyMsg?: string) {
        authorOnlyMsg =
            authorOnlyMsg !== undefined
                ? authorOnlyMsg
                : "This button is not for you";
        this.client.on("interactionCreate", (interaction) => {
            if (!interaction.isButton()) return;
            const buttonObj = this.interactions[interaction.customId];

            try {
                if (buttonObj == undefined) return; // for buttons that don't need this package to respond to them.

                const author = interaction.message.interaction.user.id;
                const buttonClicker = interaction.member.user.id;

                if (buttonObj.onlyAuthor == true && author !== buttonClicker) {
                    interaction.reply({
                        content: authorOnlyMsg,
                        ephemeral: true,
                    });
                    return;
                }
                buttonObj.callback(interaction, this.client);
            } catch (error) {
                if (this.logErrors) {
                    throw new InteractionButtonError(
                        "Button $NAME$ failed with the error:\n\n" + error,
                        buttonObj.filePath,
                        interaction.customId
                    );
                }
            }
        });
    }
}
