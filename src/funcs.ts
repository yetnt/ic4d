import { CommandObject } from "./handler/interfaces";
import * as fs from "fs";
import * as path2 from "path";
import * as clc from "cli-color";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { InteractionBuilder } from "./handler/builders/InteractionBuilder";

/**
 * Get all the command objects. This is the same function inherited from the CoreHandler used by the CommandHandler.
 * @param path Path to the commands.
 * @param exceptions Commands to not get.
 * @returns CommandObject[]
 */
export function getLocalCommands(
    path: string,
    exceptions: string[] = []
): CommandObject[] {
    const scanDirectory = (directory: string): CommandObject[] => {
        const items = fs.readdirSync(directory);

        return items.flatMap((item) => {
            const itemPath = path2.join(directory, item);
            const isDirectory = fs.statSync(itemPath).isDirectory();

            if (isDirectory) {
                return scanDirectory(itemPath);
            } else if (item.endsWith(".js")) {
                const commandObject: CommandObject & {
                    isCommand?: boolean;
                    customId?: string;
                } = require(itemPath);

                if (
                    !commandObject.description ||
                    commandObject.isCommand ||
                    commandObject.customId ||
                    exceptions.includes(commandObject.name)
                ) {
                    return [];
                }
                commandObject.filePath = itemPath;
                return [commandObject];
            }
            return [];
        });
    };

    return scanDirectory(path);
}

/**
 * Sets up a collector for message components with a specified timeout.
 *
 * @param client - The Discord client instance.
 * @param initInteraction - The initial interaction that triggered the setup.
 * @param interaction - An object containing the interaction details, including the onTimeout function, timeout duration, and customId.
 */
export async function setupCollector(
    client: Client,
    initInteraction: ChatInputCommandInteraction,
    interaction: InteractionBuilder
) {
    const { onTimeout, timeout, customId } = interaction;

    const collector = initInteraction.channel.createMessageComponentCollector({
        time: timeout,
        filter: (i) => i.customId === customId,
    });

    collector.once("collect", (i) => {
        // Handle the button click here or simply notify that it was clicked
        // i.reply({ content: "Button was clicked!", ephemeral: true });
        collector.stop("respondedInTime"); // Stop the collector after a click is detected. This is in a comment because when it's run it emits the "end" event.
    });

    collector.once("end", async (collected, reason) => {
        if (reason !== "respondedInTime")
            await onTimeout(initInteraction, client);
    });
}
