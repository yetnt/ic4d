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
            .replace("$NAME$", clc.italic.bold.underline(commandName))
            .replace(
                "$NAMECONTEXT$",
                clc.italic.bold.underline(commandName + " (context menu)")
            );
        this.name = name;
        this.fileName = file; // Additional property to store the file name
    }
}

export class LoaderError extends ic4dError {
    constructor(message: string, file: string, commandName?: string) {
        super("CommandLoaderError", message, file, commandName);
    }
}

export class ContextLoaderError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("ContextMenuLoaderError", message, file, commandName);
    }
}

export class ContextHandlerError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("ContextMenuHandlerError", message, file, commandName);
    }
}

export class HandlerError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("CommandHandlerError", message, file, commandName);
    }
}

export class ButtonError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("InteractionButtonError", message, file, commandName);
    }
}

export class SelectMenuError extends ic4dError {
    constructor(message: string, file?: string, commandName?: string) {
        super("InteractionSelectMenuError", message, file, commandName);
    }
}
