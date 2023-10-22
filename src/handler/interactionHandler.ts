import { CoreHandler } from "./coreHandler";
import {
    Client,
    Interaction,
    ButtonInteraction,
    StringSelectMenuInteraction,
} from "discord.js";

export interface InteractionObject {
    customId?: string;
    description?: string;
    onlyAuthor?: boolean;
    callback: (
        interaction: ButtonInteraction | StringSelectMenuInteraction
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
            };
            return acc;
        }, {});
        this.logErrors = logErrors == true ? true : false;
    }

    /**
     * Start listening for buttons.
     */
    buttons() {
        this.client.on("interactionCreate", (interaction) => {
            if (!interaction.isButton()) return;

            try {
                const buttonObj = this.interactions[interaction.customId];
                if (buttonObj == undefined) return;

                const author = interaction.message.interaction.user.id;
                const buttonClicker = interaction.member.user.id;

                if (buttonObj.onlyAuthor == true && author !== buttonClicker) {
                    interaction.reply({
                        content: "This button is not for you",
                        ephemeral: true,
                    });
                    return;
                }
                buttonObj.callback(interaction);
            } catch (error) {
                if (this.logErrors) {
                    throw new Error(error);
                }
            }
        });
    }
}
