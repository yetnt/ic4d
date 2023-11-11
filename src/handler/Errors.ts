import * as clc from "cli-color";

class ic4dError extends Error {
    // throw new ic4dError("something", "msg", "file")
    fileName: string;
    constructor(
        name: string,
        message: string,
        file?: string,
        commandName?: string
    ) {
        super(message);
        this.message = message
            .replace("$PATH$", clc.bold.underline(file))
            .replace("$NAME$", clc.italic.bold.underline(commandName));
        this.name = name;
        this.fileName = file; // Additional property to store the file name
    }
}

export class CommandLoaderError extends ic4dError {
    constructor(message: string, file: string, commandName?: string) {
        super("LoaderError", message, file, commandName);
    }
}

export class CommandHandlerError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("HandlerError", message, file, commandName);
    }
}

export class InteractionButtonError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("InteractionButtonError", message, file, commandName);
    }
}
