import {
    ContextMenuCommandInteraction,
    Client,
    ApplicationCommandType,
    ContextMenuCommandBuilder,
} from "discord.js";

/**
 * @class
 * Represents a context menu
 */
export class ContextMenuBuilder {
    isCommand: boolean = false; // This is so that when it's read by th command handler, it's skipped. And because it's its own interaction like slash commands, the interaction handler reads it seprately.
    type: ApplicationCommandType;
    name: string;
    callback: (interaction: ContextMenuCommandInteraction) => void;
    deleted: boolean;

    /**
     *
     * @param name Name of the context menu.
     */
    constructor(name: string) {
        this.name = name;
    }

    /**
     * Sets the type of the context menu
     * @param type Context Menu type.
     * @returns
     */
    setType(type: ApplicationCommandType): ContextMenuBuilder {
        this.type = type;
        return this;
    }

    /**
     * Sets the deleted property of the context menu.
     * @param deleted Boolean indicating whether the context menu is deleted.
     * @returns
     */
    setDeleted(deleted: boolean): ContextMenuBuilder {
        this.deleted = deleted;
        return this;
    }
}
