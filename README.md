# int4d

Interactions 4 Dummies

# Quick Example

```js
require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const path = require("path");

const { CommandHandler, ReadyHandler } = require("int4d");

const commandsPath = "commands";
const readerOptions = {
    devs: ["671549251024584725"],
    testGuildId: "808701451399725116",
};

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
    ],
});

const handler = new CommandHandler(
    client,
    path.join(__dirname, "commands"),
    readerOptions
);
const ready = new ReadyHandler(
    client,
    async (client) => {
        console.log(`${client.user.tag} is ready!`);
    },
    async () => {
        await handler.registerCommands();
    }
);

async () => {
    await handler.handleCommands();
    ready.execute();
};

client.login(process.env.TOKEN);
```

# ReadyHandler

Ready handler is a handler that runs a set of functions when the bot starts.

## Constructor

-   `client`: Discord.js Client Instance
-   `...functions`: Functions to run when the `execute()` method is called, and the ready event has been emitted. Functions may take one parameter (client) or none.

```js
const { ReadyHandler } = require("int4d");

const ready = new ReadyHandler(
    client,
    (client) => {
        console.log(`${client.user.tag} is ready!`);
    },
    () => {
        console.log("Lol another function");
    }
);
```

## Methods

### `execute()`

Start listening for the bot's ready event and execute functions once the event is called.

```js
const ready = new ReadyHandler(client, ...)

ready.execute()
```

# CommandHandler

Command Handler, which handles slash command creation, deletion, editing and running of slash commands

## Pre-Read

Before you use the CommandHandler class, make sure you have a `/commands/` folder with all the commands you'd like to import, they should export an object with these minimum parameters:

```js
module.exports = {
    name: "command-name",
    description: "Command Description that looks cool",
    callback: async (client, interaction) => {
        interaction.reply("Wow!");
    },
};
```

## Constructor

### Parameters

-   `client`: Discord.js Client Instance
-   `path`: Path in which your exported command objects are stored. The handler will **not** work if you do not use path.
-   `readerOptions`**(optional)**: Command Reader Options
-   `loaderOptions`**(optional)**: Command Loader Options

```js
const { CommandHandler } = require("int4d");
const path = require("path");

const handler = new CommandHandler(client, path.join(__dirname, "commands"));
```

#### readerOptions

Information for the handler and text that displays the the user when the CommandHandler is running checks before the actual command's code

```js
{
    testGuildId: "808701451399725116",
    devs: ["671549251024584725"],

    // next params are not required, but cool
    onlyDev: "Text to display when a user runs a developer command.",
    userNoPerms: "Text to display when the user has insufficient permissions",
    botNoPerms: "Text to display when the bot has insufficient permissions"
}
```

#### loaderOptions

Text that displays in the console when the CommandHandler is loading a command.

Make sure you keep `NAME` in the string or else you will not know what happened to which command.
If there is no log in the console for a specific command, then it has been loaded, there are no edits and it has not been deleted.

```js
{
        loaded: "NAME has been registered successfully.",
        edited: "NAME has been edited.",
        deleted: "NAME has been deleted.",
        skipped: "NAME was skipped. (Command deleted or set to delete.)",
}
```

## Methods

### registerCommands()

**(asynchronous function)**

-   `serverId`**(optional)**: Register all commands in a specific server. if not provided it will be application wide

```js
const handler = new CommandHandler(client, path.join(__dirname, "commands"));

async () => {
    await handler.registerCommands();
};
```

### handleCommands()

**(asynchronous function)**

-   `...middleWare`: Functions to run before a command is run.

```js
const handler = new CommandHandler(client, path.join(__dirname, "commands"));

const blacklisted = ["302983482377931"];
const blacklist = (commandObject, interaction) => {
    if (commandObject.blacklist && blacklisted.includes(interaction.user.id)) {
        interaction.reply({
            content: this.readerOptions.onlyDev,
            ephemeral: true,
        });
        return 1;
    }
    return 0;
};

await handler.handleCommands(blacklist);
```

#### Middleware Parameters and use

Middleware is to define your own custom functions you want to run when a command is run by anyone. This can be a function to check for cooldown or function to add XP to a user.

Middleware that the package already contains is :

-   Check to see if developer command
-   Check to see if bot has sufficient permissions
-   Check to see if user has sufficient permissions

The Middleware **must** take in these parameters

-   `commandObject`: This is the commandObject that every command contains, this can check for the commands name, description, options, choices or a custom property you wish
-   `interaction`**(optional)**: If the middleware function requires you to take in interaction for some reason, here you go 😃

And should always return 1 or another number. If it returns 1 it counts as a fail so the function won't proceed. Another number returned is okay seen as a pass and the function continues.
(If you don't understand, if a normal user tries to run a dev command, it will return 1, which means it wont run and their met with a fail message)

##### Example

Here i define a command with the custom property `canBeServerDisabled`

```js
module.exports = {
    name: "rob",
    description: "Rob users",
    canBeServerDisabled: true,
    callback: async (client, interaction) => {
        interaction.reply("bang bang!");
    },
};
```

And in my middleware function i check if the command has been server disabled, if the property is enabled.

```js
const isServerDisabled = (name) => {
    // check to see if the function has been disabled by the server, if so return true, otherwise false.
};

const middleWare = (commandObject, interaction) => {
    if (
        commandObject.canBeServerDisabled &&
        isServerDisabled(commandObject.name)
    ) {
        interaction.reply({
            content: this.readerOptions.onlyDev,
            ephemeral: true,
        });
        return 1;
    }
    return 0;
};

handler.handleCommands(middleWare); // pass the function alone with brackets or its parameters, i'll do that magic
```

# Command Layout

This package requires your commands to be layed out specifically.

## Normal

```js
module.exports = {
    name: "rob",
    description: "Rob a user for coins bro",
    callback: async (client, interaction) => {
        interaction.reply("yooooo");
    },
};
```

## Deleted

Command will be deleted and when it's loaded again it will be skipped.

```js
module.exports = {
    name: "rob",
    description: "Rob a user for coins bro",
    deleted: true,
    callback: async (client, interaction) => {
        interaction.reply("yooooo");
    },
};
```

## Developer Only Command

Command that only a developer can run

```js
module.exports = {
    name: "rob",
    description: "Rob a user for coins bro",
    devOnly: true,
    callback: async (client, interaction) => {
        interaction.reply("yooooo");
    },
};
```

## Permissions Required

User needs permission

```js
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "rob",
    description: "Rob a user for coins bro",
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    callback: async (client, interaction) => {
        interaction.reply("yooooo");
    },
};
```

# Credits

Huge credit to [underctrl](https://github.com/notunderctrl), Code would've not been possible if i did not watch his helpful discord.js tutorials!

# Links

[Github](https://github.com/YetNT/int4d)
[NPM](https://www.npmjs.com/package/int4d)
[underctrl discord.js tutorials](https://www.youtube.com/playlist?list=PLpmb-7WxPhe0ZVpH9pxT5MtC4heqej8Es)
