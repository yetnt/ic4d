# ic4d

**I**nteractions and **C**ommand handler **4** **D**ummies

# Installation

With npm

```
npm i ic4d
```

With yarn

```
yarn add ic4d
```

```js
const ic4d = require("ic4d");
// or
const {
    /* Classess you need seprated by a comma */
} = require("ic4d");
```

and for yall ts lovers (I tried using this in ts and damn is it hard work.)

```ts
import * as ic4d from "ic4d";
// or
import /* Class you need separated by a comma */ "ic4d";
```

# Contents

-   [Quick Example](#quick-example)
-   Handlers
-   -   [ReadyHandler](#readyhandler)
-   -   [CommandHandler](#commandhandler)
-   -   [InteractionHandler](#interactionhandler)
-   Builders
-   -   [SlashCommandManager](#slashcommandmanager)
-   -   [InteractionBuilder](#interactionbuilder)
-   -   [ContextMenuBuilder](#contextmenubuilder)
-   [Common Problems](#common-problems)
-   [Credit](#credits)
-   [Links](#links)

Deprecated Classes and Documentation.

-   Objects
-   -   [Command Object](#command-object)
-   -   [Interaction Object](#interaction-object)
-   [Same file Command and Interactions (Class builders)](#command-and-interactions-in-the-same-file)
-   -   [CommandInteractionObject](#commandinteractionobject)
-   -   [SlashCommandObject](#slashcommandobject)

# Quick Example

[Here's the example bot](https://github.com/YetNT/ic4d-example-bot) if you don't like reading

```js
require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const path = require("path");

const { CommandHandler, ReadyHandler } = require("ic4d");

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

(async () => {
    await handler.handleCommands();
    ready.execute();
})();

client.login(process.env.TOKEN);
```

# ReadyHandler

Ready handler is a handler that runs a set of functions when the bot starts.

## Constructor

-   `client`: Discord.js Client Instance
-   `...functions`: Functions to run when the `execute()` method is called, and the ready event has been emitted. Functions may take one parameter (client) or none.

```js
const { ReadyHandler } = require("ic4d");

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

## Constructor

### Parameters

-   `client`: Discord.js Client Instance
-   `path`: Path in which your exported command objects are stored. The handler will **not** work if you do not use path.
-   `readerOptions`**(optional)**: Command Reader Options
-   `loaderOptions`**(optional)**: Command Loader Options

```js
const { CommandHandler } = require("ic4d");
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
        loadedNoChanges: "NAME was loaded. No changes were made to NAME."
        loaded: "NAME has been registered successfully.",
        edited: "NAME has been edited.",
        deleted: "NAME has been deleted.",
        skipped: "NAME was skipped. (Command deleted or set to delete.)",
}
```

## Methods

### `registerCommands()`

**(asynchronous function)**

-   `logAll`**(optional)**: Log command even if no change was performed.
-   `serverId`**(optional)**: Register all commands in a specific server. if not provided it will be application wide

```js
const handler = new CommandHandler(client, path.join(__dirname, "commands"));

async () => {
    await handler.registerCommands();
};
```

### `handleCommands()`

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
const {SlashCommandManager} = require("ic4d");
const {SlashCommandBuilder} = require("discord.js");

const rob = new SlashCommandManager({
    data: new SlashCommandBuilder()
        .setName("rob")
        .setDescription("Rob users")
    execute: (interaction, client) => {
        interaction.reply("bang bang!");
    },
});

rob.canBeServerDisabled = true;

module.exports = rob
```

And in my middleware function i check if the command has been server disabled, if the property is enabled.

```js
const isServerDisabled = (name) => {
    // check to see if the function has been disabled by the server, if so return true, otherwise false.
};

const middleWare = (commandObject, interaction) => {
    // you can name the parameters whatever you want, ass long as you remember which one is which.
    if (
        commandObject.canBeServerDisabled &&
        isServerDisabled(commandObject.name)
    ) {
        interaction.reply({
            content: "This command is server disabled",
            ephemeral: true,
        });
        return 1;
    }
    return 0;
};

handler.handleCommands(middleWare); // pass the function alone without brackets or its parameters, i'll do that magic
```

### `emitErrors()`

Set whether the ready handler should throw or emit errors. Defaults to false.

```js
const handler = new CommandHandler(client, path.join(__dirname, "commands"));
handler.emitErrors(true);

// Listen for the error
handler.on("error", (msg) => {
    // do something with the error message
});
```

# InteractionHandler

Handler to handle interactions.

## Pre-Read

Context Menus work a bit differently then the other interactions, please refer to [registerContextMenus()](#registercontextmenus)

## Constructor

-   `client`: Discord.js client
-   `path`: Path to where interactions are stored. (They can be stored in your commands folder to, as long as they meet with [interactions object](#interaction-object))
-   `loaderOptions`**(optional)**: Context Menu [Loader Options](#loaderoptions)

```js
const { InteractionHandler } = require("ic4d");
const path = require("path");

const interactions = new InteractionHandler(
    client,
    path.join(__dirname, "commands")
);
```

## Methods

### `start()`

Start listening for all the available interactions. (Context Menus, Buttons, Select Menus and Modals)

-   `authorOnlyMsg`**(optional)**: Message to display when a interacts with another user's interaction (onlyAuthor is set to true.)
-   `...middleWare`: Functions to run before an interaction is run.

```js
interactions.start();
```

### `buttons()`

Start listening for button interactions.

-   `authorOnlyMsg`**(optional)**: Message to display when a user click's another user's button (onlyAuthor is set to true.)
-   `...middleWare`: Functions to run before a button is run.

```js
interactions.buttons();
```

### `selectMenus()`

Start listening for select menu interactions.

-   `authorOnlyMsg`**(optional)**: Message to display when a user click's another user's select menu (onlyAuthor is set to true.)
-   `...middleWare`: Functions to run before a select menu is run.

```js
interactions.selectMenu();
```

### `modals()`

Start listening for modal interactions. (After their registered)

-   `...middleWare`: Functions to run before a modal is shown.

```js
interactions.modals();
```

### `contextMenus()`

Start listening for context menu interactions. (After their registered)

-   `...middleWare`: Functions to run before a context menu is run.

```js
interactions.contextMenus();
```

#### Interactions Middleware

Exactly like [Command Middleware](#middleware-parameters-and-use), where 1 will return and any number will continue execution. Only difference is here the only parameter you get is interaction.

#### Example

```js
function isAuthor(interaction) {
    // the handler does this for you (check the InteractionObject) but im writing this as an example only.
    const author = interaction.message.interaction.user.id;
    const clicker = interaction.member.user.id;

    return clicker === author ? 1 : 0;
}
function lucky(interaction) {
    // randdom one
    return 1 == 1 ? 1 : 0; // will always return 1.
}

// some other code

interactions.buttons("This isn't your button!", isAuthor); // this will only run for buttons.
interactions.start(undefined, lucky); // will run for every interactions
```

### `registerContextMenus()`

**(asynchronous function)**

Registers Context Menus that are found in the path given tot he InteractionHandler.

-   `logAll`**(optional)**: Log context menu even if no change was performed.
-   `serverId`**(optional)**: Register all commands in a specific server. if not provided it will be application wide

```js
await interactions.registerContextMenus();
```

# SlashCommandManager

This class represents a single command that is immediately exported from a file in the `"commands"` directory of your choosing

> [!NOTE] Methods can be chained together

Exmaple:

```js
const { SlashCommandManager } = require("ic4d");

const command = new SlashCommandManager();

module.exports = command;
```

## Constructor

-   `commandObject`: Command's data, Only takes in 2 properties: `data` property which contains the command's data from the discord.js provided class `SlashCommandBuilder` and the `execute` property which takes in a function with the `interaction` and `client` parameter.

Example:

```js
const { SlashCommandManager } = require("ic4d");

const command = new SlashCommandManager({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong!")
        .addAttachmentOption((option) =>
            option.setName("user").setDescription("Ping a user for no reason.")
        ),
    execute: (interaction, client) => {
        interaction.reply("pong!!");
    },
});

module.exports = command;
```

## Methods

### `setUserPermissions`

Sets the permissions required by the user to execute the command.

-   `...perms`: Rest paramter of `bitInt`s provided by discord.js (class `PermissionFlagsBits`)

Example:

```js
const { SlashCommandManager } = require("ic4d");

const command = new SlashCommandManager(/* command cofig */).setUserPermissions(
    PermissionFlagsBits.Administrator
);
module.exports = command;
```

### `setBotPermissions`

Sets the permissions needed for the bot to execute the command.

-   `...perms`: Rest paramter of `bitInt`s provided by discord.js (class `PermissionFlagsBits`)

Example:

```js
const { SlashCommandManager } = require("ic4d");

const command = new SlashCommandManager(/* command cofig */).setBotPermissions(
    PermissionFlagsBits.Administrator
);
module.exports = command;
```

### `setDeleted`

Sets the commmand to be deleted, If command has already been deleted, it will be skipped when loaded again.

-   `bool`: Boolean param

Example:

```js
const { SlashCommandManager } = require("ic4d");

const command = new SlashCommandManager(/* command cofig */).setDeleted(true);
module.exports = command;
```

### `addInteractions`

Appends related interactions to the slash command, only way for slash commands and other interactions to appear in the same file.

-   `...interactions`: Rest paramater of [InteractionBuilder](#interactionbuilder)s

```js
const { SlashCommandManager, InteractionBuilder } = require("ic4d");

const command = new SlashCommandManager(/* command cofig */).addInteractions(
    new InteractionBuilder() /*...*/
);
module.exports = command;
```

# InteractionBuilder

Represents a single itneraction that isn't a chat input (slash command) or context menu. (This class can however be passed into a rest parameter in [SlashCommandManager](#slashcommandmanager) or in it's own separate file by itself.)
Builder for Context Menus: [ContextMenuBuilder](#contextmenubuilder)

> [!NOTE] Methods can be chained together

Example:

```js
const { InteractionBuilder } = require("ic4d");

const button = new InteractionBuilder()
    .setCustomId("button-1")
    .setType("button")
    .setCallback((i) => {
        i.update("whats up");
    })
    .setOnlyAuthor(true);
```

## Constructor

No parameters are passed, so no documentation :)

## Methods

### `setCustomId`

Sets the custom ID of the interaction.

-   `customId`: Custom ID of the interaction.

```js
const button = new InteractionBuilder().setCustomId("my-cool-button");
```

### `setType`

Sets the type of the interaction. (Either "selectMenu", "button" or "modal")

-   `type`: Type of the interaction.

```js
const selectMenu = new InteractionBuilder().setType("selectMenu");
```

### `setCallback`

Function to be called when the interaction is called. (Is that how you say it?)

-   `fn`: The function to be called (Parameters: `(interaction, client)`)

```js
const selectMenu = new InteractionBuilder().setCallback((i) => {
    i.update("Client parameter is optional");
});
```

### `setOnlyAuthor`

Set whether or not the interaction can only be interacted with by the author of the interaction.

-   `bool`: If true, the interaction only accepts the author's input.

```js
const button = new InteractionBuilder().setOnlyAuthor(true);
```

### `setTimeout`

Sets the interaction to have a timeout.

-   `fn`: Function to call when the interaction time expires.
-   `timeout`: How long to wait for the interaction to timeout. (in ms)

```js
const a = new InteractionBuilder().setTimeout((i) => {
    i.update("Damn the time expired brodie");
}, 10_000);
```

# ContextMenuBuilder

Builder for context menus, since they are special.

## Constructor

-   `context`: Object with 2 properties, a `data` property that is an instance of `ContextMenuBuilder` provided by discord.js and a function called `execute` to execute when the context menu is called.

```js
const {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
} = require("discord.js");
const { ContextMenuBuilder } = require("ic4d");

const user = new ContextMenuBuilder({
    data: new ContextMenuCommandBuilder()
        .setName("Get User Avatar")
        .setType(ApplicationCommandType.User),
    execute: (interaction, client) => {
        const user = interaction.targetUser;

        interaction.reply({
            ephemeral: true,
            content: user.displayAvatarURL(),
        });
    },
});

module.exports = user;
```

## Methods

### `setDeleted`

Sets the context menu to be deleted, If context menu has already been deleted, it will be skipped when loaded again.

```js
const user = new ContextMenuBuilder().setDeleted(true);
```

# Common Problems

1.  _Files in the `commands` directory trying to be read as slash commmands by the `CommandHandler` class._

    -   Example: This function is in the `commands` direcotory as it is used by multiple commands, but is not a commands itself.

    ```js
    const function a(userBalance) {
        return userBalance > 0 ? true : false;
    }

    module.exports = a;
    ```

    -   The Command Reader will try to read it but error as it is not a command it can read, to avoid this, make sure you export the `isCommand` (Set to false) property with the function.

    ```js
    const function a(userBalance) {
        return userBalance > 0 ? true : false;
    }

    module.exports = {a, isCommand = false};
    ```

    -   Usually, the reader should skip over anything it can read, but if needed, this will immediately make it skip.

# Credits

Huge credit to [underctrl](https://github.com/notunderctrl), Code would've not been possible if i did not watch his helpful discord.js tutorials! I had to give him credit because this package is based off moving all those files fromm his tutorial into one package.

He probably has a way better package, so go check his out!

# Links

-   [Github](https://github.com/YetNT/ic4d)
-   [NPM](https://www.npmjs.com/package/ic4d)
-   [underctrl Discord.js Tutorial](https://www.youtube.com/playlist?list=PLpmb-7WxPhe0ZVpH9pxT5MtC4heqej8Es)

---

---

> [!IMPORTANT]
> The following is deprecated in favor of other classes.

# Command Object

> [!IMPORTANT]
> This can still be used and will work as intended (if the following is used correctly) but it's encouraged to use the [SlashCommandManager](#slashcommandmanager) class instead.

This package requires your command object to be layed out specifically, (If you're coming from a normal discord.js handler that uses the execute and data properties, skip to [Tradtional discord.js object](#tradtional-discordjs-object))

## Using Class

You can use the class to build the command. (see [SlashCommandObject](#slashcommandobject))

```js
const { SlashCommandObject } = require("ic4d");

const rob = new SlashCommandObject({
    name: "rob",
    description: "Rob a user for coins bro",
    callback: async (client, interaction) => {
        interaction.reply("yooooo");
    },
});

module.exports = rob;
```

and when you need to add a new property (to get other stuff below) just

```js
rob.deleted = true; // it's as simple as that!
rob.devOnly = true; // or you can add it to the object directly. Just showing this can work.
```

## Normal

minimum requirements

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

## Tradtional Discord.js Object

If you're user the `data` property which exports the class `SlashCommandBuidler` and the `execute` property. Like the discord.js docs have it, you can implement it here! (Although you have to use [SlashCommandObject](#slashcommandobject))

```js
const { SlashCommandObject } = require("ic4d");
const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandObject({
    data: new SlashCommandBuilder()
        .setName("rob")
        .setDescription("ROb a user for coins bro."),
    async execute(interaction, client) {
        // client is an optional parameter.
        interaction.reply("balls");
    },
    deleted: false, // add these properties above if you have to.
});
```

# Interaction Object

> [!IMPORTANT]
> This can still be used and will work as intended (if the following is used correctly) but it's encouraged to use the [InteractionBuilder](#interactionbuilder) class instead.

Package also requires that wherever you store your interaction object (buttons, select menus, context menus etc), they have thesse minimum requirements:

## Normal (button)

```js
module.exports = {
    customId: "button1",
    type: "button",
    callback: (i) => {
        // callback
    },
};
```

## Author Only (selectMenu)

Not required but is handy

```js
module.exports = {
    customId: "coolSelectMenu",
    type: "selectMenu",
    authorOnly: true,
    callback: (i) => {
        // callback
    },
};
```

## Takes in client (modal)

Not required, but also handy

```js
module.exports = {
    customId: "myEpicModal",
    type: "modal",
    callback: (i, client) => {
        // callback
    },
};
```

## Timeout parameter

This parameter makes it so that after (foo) milliseconds, the action row will be cleared and the original message will be edited to (bar). Effectively making a button click or select menu selection have a limited time window. **(Only for **Buttons** and **Select Menus**)**

The `onTimeout` parameter takes in a function and is invoked when the interaction times out, of course.

```js
module.exports = {
    customId: "button5",
    type: "button",
    callback: (i) => {
        // callback
    },
    timeout: 10_000,
    onTimeout: (i) => {
        i.update("yup");
    },
};
```

## Context Menu

> [!IMPORTANT]
> This is deprecated, use [ContextMenuBuilder](#contextmenubuilder) class instead.

This works a little differently to ones above, that's why it has it's own category lol.

```js
const { ApplicationCommandType } = require("discord.js");

module.exports = {
    name: "context",
    isCommand: false,
    type: ApplicationCommandType.User,
    callback: (interaction) => {
        const user = interaction.targetUser;
    },
};
```

or

```js
const {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
} = require("discord.js");

module.exports = {
    ...new ContextMenuCommandBuilder()
        .setName("Balls")
        .setType(ApplicationCommandType.Message),
    isCommand: false,
    callback: (interaction) => {
        const message = interaction.targetMessage;
    },
};
```

# Command and Interactions in the same file

> [!IMPORTANT]
> This is deprecated, use [addInteractions()](#addinteractions) method in the [SlashCommandManager](#slashcommandmanager) class instead.

If you do not like having random buttons everywhere in different files, don't worry the following classess are here to help you!

here's a quick example for yall quickers

```js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { SlashCommandObject, CommandInteractionObject } = require("ic4d");

const ok = new CommandInteractionObject({
    customId: "ok",
    type: "button",
    authorOnly: true,
    callback: async (i) => {
        i.update({ content: "this is from the same file", components: [] });
    },
    timeout: 20_000, // 20 seconds
    onTimeout: (i) => {
        i.update({ content: "You're too slow!" });
    },
});

const random = new SlashCommandObject(
    {
        name: "random",
        description: "random thing",

        callback: async (client, interaction) => {
            await interaction.reply({
                content: "ok",
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("ok")
                            .setLabel("ok")
                            .setStyle(ButtonStyle.Danger)
                    ),
                ],
            });
        },
    },
    ok
);

module.exports = random;
```

## CommandInteractionObject

> [!IMPORTANT]
> This is deprecated, use [InteractionBuilder](#interactionbuilder) class instead.

### Constructor

Represents an interaction object **(NOT FOR CONTEXT MENUS)**

This is layed out exactly as [Interaction Object](#interaction-object), just in extra code.

-   `intObj`: Object with properties associated with the interaction

```js
const intObj = {
    customId: "mySelect", // the custom id of the interaction
    type: "selectMenu", // the type of interaction. can be "selectMenu", "button" or "modal"
    timeout: 10_000,
    onTimeout: (i) => {
        i.update("too slow.");
    },
    callback: (i) => {
        // do something
    },
    onlyAuthor: false,
};

const mySelect = new CommandInteractionObject(intObj);
```

## SlashCommandObject

> [!IMPORTANT]
> This is deprecated, use [SlashCommandManager](#slashcommandmanager) class instead.

Represents a slash command object.

This is layed out exactly as [Command Object](#command-object), just in extra code.

-   `commandObject`: Object with properties associated with the command
-   `...interactions`: An array of [CommandInteractionObject](#commandinteractionobject) that is associated with this file.

```js
// we'll be using mySelect from above

const commandObject = {
    name: "showselect",
    description: "shows you a cool select menu",
    callback: async (client, interaction) => {
        // show it
    },
};

module.exports = new SlashCommandObject(
    commandObject,
    mySelect /* add you can just keep adding more interactions seprated by a comma.*/
);
```

and that's mostly it!
