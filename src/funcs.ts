import { CommandObject } from "./handler/commandHandler";
import * as fs from "fs";
import * as path2 from "path";
import * as clc from "cli-color";

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
 * Add deprecated string.
 * @param isOld
 */
export function deprecated(txt: string, isOld: boolean) {
    return isOld
        ? txt +
              " " +
              clc.bold.bgRedBright.white("(Command uses deprecated syntax!)")
        : txt;
}
