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

export class InteractionHandler extends ic4dError {
    constructor(
        errorName: string,
        message: string,
        file: string,
        interactionCustomId?: string
    ) {
        super(
            errorName || "InteractionHandlerError",
            message,
            file,
            interactionCustomId
        );
    }
}

export class ContextLoaderError extends InteractionHandler {
    constructor(message: string, file?: string, interactionCustomId?: string) {
        super("ContextMenuLoaderError", message, file, interactionCustomId);
    }
}

export class ContextHandlerError extends InteractionHandler {
    constructor(message: string, file?: string, interactionCustomId?: string) {
        super("ContextMenuHandlerError", message, file, interactionCustomId);
    }
}

export class HandlerError extends InteractionHandler {
    constructor(message: string, file?: string, interactionCustomId?: string) {
        super("CommandHandlerError", message, file, interactionCustomId);
    }
}

export class ButtonError extends InteractionHandler {
    constructor(message: string, file?: string, interactionCustomId?: string) {
        super("InteractionButtonError", message, file, interactionCustomId);
    }
}

export class ModalError extends InteractionHandler {
    constructor(message: string, file?: string, interactionCustomId?: string) {
        super("InteractionModalError", message, file, interactionCustomId);
    }
}

export class SelectMenuError extends InteractionHandler {
    constructor(message: string, file?: string, interactionCustomId?: string) {
        super("InteractionSelectMenuError", message, file, interactionCustomId);
    }
}
