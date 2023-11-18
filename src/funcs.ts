import {CommandObject} from "./handler/commandHandler"
import * as fs from "fs"
import * as path2 from "path"

export function getLocalCommands(
        path: string,
        exceptions?: string[]
    ): CommandObject[] {
        exceptions = exceptions !== undefined ? exceptions : [];
        let localCommands: CommandObject[] = [];

        const scanDirectory = (directory: string) => {
            const items = fs.readdirSync(directory);
            let arr: CommandObject[] = [];

            for (const item of items) {
                const itemPath = path2.join(directory, item);
                const isDirectory = fs.statSync(itemPath).isDirectory();

                if (isDirectory) {
                    arr = arr.concat(scanDirectory(itemPath));
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
                        continue;
                    }
                    commandObject.filePath = itemPath;
                    arr.push(commandObject);
                }
            }

            return arr;
        };

        localCommands = scanDirectory(path);
        return localCommands;
    }
