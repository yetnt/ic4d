# ic4d

**I**nteractions and **C**ommand handler **4** **D**ummies

# DEVELOPMENT BRANCH

This branch wont have versions pushed to it nor npm. if you want to install and run locally you'll have to get it from github and run `npm run build` on your machine. Sorry not sorry

# Installation

With npm

```
npm i ic4d
```

with yarn

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
import /* Classes and/or Interfaces you need separated by a comma */ "ic4d";
```

# Contents

If any method/function has no return documentation, it returns void.

-   [Quick Example](#quick-example)
-   Classes
    -   [ReadyHandler](#readyhandler)
    -   [CommandHandler](#commandhandler)
    -   [InteractionHandler](#interactionhandler)
    -   [SlashCommandManager](#slashcommandmanager)
    -   [InteractionBuilder](#interactionbuilder)
    -   [ContextMenuBuilder](#contextmenubuilder)

For TS Lovers:

-   Interfaces
    -   [RunFlags](#runflags)
    -   [HandlerFlags](#handlerflags)
    -   [InteractionHandlerFlags](#interactionhandlerflags)
    -   [LoaderOptions](#loaderoptions)
-   Other Types
    -   [InteractionTypeStrings](#interactiontypestrings)
-   [Common Problems](#common-problems)
-   [Credit](#credits)
-   [Links](#links)

# Quick Example

[Here's the example bot](https://github.com/YetNT/ic4d-example-bot) if you don't like reading

this is what you're index.js should look something like.

```js
require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const path = require("path");

const { CommandHandler, ReadyHandler } = require("ic4d");

const commandsPath = "commands";
const runFlags = {
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
    path.join(__dirname, commandsPath),
    runFlags
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
    ready.execute();
    await handler.handleCommands();
})();

client.login(process.env.TOKEN);
```

And in any file in any folder under your specified `commands` directory

```js
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { SlashCommandObject, SlashCommandManager } = require("ic4d");

const ping = new SlashCommandManager({
    data: new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
    async execute(interaction, client) {
        try {
            const sent = await interaction.reply({
                embeds: [new EmbedBuilder().setDescription("Pinging...")],
                fetchReply: true,
            });
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Pong!")
                        .setFields([
                            {
                                name: "Roundtrip latency",
                                value: `${
                                    sent.createdTimestamp -
                                    interaction.createdTimestamp
                                }ms`,
                                inline: true,
                            },
                            {
                                name: "Websocket heartbeat",
                                value: `${client.ws.ping}ms.`,
                                inline: true,
                            },
                        ])
                        .setColor("Green"),
                ],
            });
        } catch (error) {
            console.error(error);
        }
    },
});

ping.category = "misc"; // if you want to add your own property to the exorted object, you can do this

module.exports = ping;
// or
module.exports = { ping };
```

# ReadyHandler

Ready handler is a handler that runs a set of functions when the bot starts.

## Constructor

-   `client`**: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)**
    -   Discord.js Client Instance
-   `...functions`**: ((client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)) => Promise\<void> | void )[] = []**
    -   Functions to run when the `execute()` method is called, and the ready event has been emitted. Functions may take one parameter (client) or none.

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

-   `client`**: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)**
    -   Discord.js Client Instance
-   `path`**: string**
    -   Path in which your exported command objects are stored. The handler will **not** work if you do not use path.
-   `runFlags`**: [RunFlags](#runflags)**
    -   **(optional)** Command Reader Options
-   `loaderOptions`**: [LoaderOptions](#loaderoptions)**
    -   **(optional)** Command Loader Options

```js
const { CommandHandler } = require("ic4d");
const path = require("path");

const handler = new CommandHandler(client, path.join(__dirname, "commands"));
```

## Methods

### `registerCommands()`

**(asynchronous function)**

-   `logAll`**: boolean**
    -   **(optional)** Log command even if no change was performed.
-   `serverId`**: string**
    -   **(optional)** Register all commands in a specific server. if not provided it will be application wide

```js
const handler = new CommandHandler(client, path.join(__dirname, "commands"));

async () => {
    await handler.registerCommands();
};
```

### `handleCommands()`

**(asynchronous function)**

-   `middleWare`**: ( ( commandObject: Object, interaction?: [ChatInputCommandInteraction](https://discord.js.org/docs/packages/discord.js/main/ChatInputCommandInteraction:Class) ) => number | Promise<number> )[]**
    -   Functions to run before a command is run.
-   `postWare`**: ( ( commandObject: Object, interaction?: [ChatInputCommandInteraction](https://discord.js.org/docs/packages/discord.js/main/ChatInputCommandInteraction:Class) ) => any )[]**
    -   Functions to run AFTER the command's callback has been called.

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

const addXp = (commandObject, interaction) => {
    if (commandObject.category != "Economy") return;
    // Xp stuff
};

await handler.handleCommands([blacklist], [addXp]);
```

#### Middleware Parameters and use

> [!NOTE]  
> This is ONLY for `middleWare` and does NOT apply to `postWare` functions.

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

handler.handleCommands([middleWare]); // pass the function alone without brackets or its parameters, i'll do that magic
```

# InteractionHandler

Handler to handle interactions.

## Pre-Read

Context Menus work a bit differently then the other interactions, please refer to [registerContextMenus()](#registercontextmenus)

## Constructor

-   `client`**: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)**

    -   Discord.js client

-   `path`**: string**

    -   Path to where interactions are stored.

-   `loaderOptions`**: [LoaderOptions](#loaderoptions)**

    -   **(optional)** Context Menu Loader Options

-   `flags`**: [InteractionHandlerFlags](#interactionhandlerflags)**

    -   **(optional)** Interaction Handler Flags

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

-   `authorOnlyMsg`**: string**
    -   **(optional)** Message to display when a interacts with another user's interaction (onlyAuthor is set to true.)
-   `...middleWare`**: ((interaction?: [Interaction](https://discord.js.org/docs/packages/discord.js/main/Interaction:TypeAlias)) => number)[]**
    -   Functions to run before an interaction is run.

```js
interactions.start();
```

### `buttons()`

Start listening for button interactions.

-   `authorOnlyMsg`**: string**
    -   **(optional)** Message to display when a user click's another user's button (onlyAuthor is set to true.)
-   `...middleWare`**: ((interaction?: [Interaction](https://discord.js.org/docs/packages/discord.js/main/Interaction:TypeAlias)) => number)[]**
    -   Functions to run before a button is run.

```js
interactions.buttons();
```

### `selectMenus()`

Start listening for select menu interactions.

-   `authorOnlyMsg`**: string**
    -   **(optional)** Message to display when a user click's another user's select menu (onlyAuthor is set to true.)
-   `...middleWare`**: ((interaction?: [Interaction](https://discord.js.org/docs/packages/discord.js/main/Interaction:TypeAlias)) => number)[]**
    -   Functions to run before a select menu is run.

```js
interactions.selectMenu();
```

### `modals()`

Start listening for modal interactions. (After their registered)

-   `...middleWare`**: ((interaction?: [Interaction](https://discord.js.org/docs/packages/discord.js/main/Interaction:TypeAlias)) => number)[]**
    -   Functions to run before a modal is shown.

```js
interactions.modals();
```

### `contextMenus()`

Start listening for context menu interactions. (After their registered)

-   `...middleWare`**: ((interaction?: [Interaction](https://discord.js.org/docs/packages/discord.js/main/Interaction:TypeAlias)) => number)[]**
    -   Functions to run before a context menu is run.

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

-   `logAll`**: string**
    -   **(optional)** Log context menu even if no change was performed.
-   `serverId`**: string**
    -   **(optional)** Register all commands in a specific server. if not provided it will be application wide

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

-   `commandObject`**: {
    data: [SlashCommandBuilder](https://discord.js.org/docs/packages/builders/1.8.2/SlashCommandBuilder:Class);
    execute: (
    interaction: [ChatInputCommandInteraction](https://discord.js.org/docs/packages/discord.js/main/ChatInputCommandInteraction:Class),
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)
    ) => void | Promise\<void>**
    -   Command's data, Only takes in 2 properties: `data` property which contains the command's data from the discord.js provided class `SlashCommandBuilder` and the `execute` property which takes in a function with the `interaction` and `client` parameter.

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

-   `...perms`**: bigint[]**
    -   Rest paramter of `bigint`s provided by discord.js ([PermissionFlagsBits](https://discord-api-types.dev/api/discord-api-types-payloads/common#PermissionFlagsBits))

**_`returns`: [self](#slashcommandmanager)_**

Example:

```js
const { SlashCommandManager } = require("ic4d");
const { PermissionFlagsBits } = require("discord.js");

const command = new SlashCommandManager(/* command cofig */).setUserPermissions(
    PermissionFlagsBits.Administrator
);
module.exports = command;
```

### `setBotPermissions`

Sets the permissions needed for the bot to execute the command.

-   `...perms`**: bigint[]**
    -   Rest paramter of `bigint`s provided by discord.js ([PermissionFlagsBits](https://discord-api-types.dev/api/discord-api-types-payloads/common#PermissionFlagsBits))

**_`returns`: [self](#slashcommandmanager)_**

Example:

```js
const { SlashCommandManager } = require("ic4d");
const { PermissionFlagsBits } = require("discord.js");

const command = new SlashCommandManager(/* command cofig */).setBotPermissions(
    PermissionFlagsBits.Administrator
);
module.exports = command;
```

### `setDeleted`

Sets the commmand to be deleted, If command has already been deleted, it will be skipped when loaded again.

-   `bool`**: boolean**
    -   Boolean param

**_`returns`: [self](#slashcommandmanager)_**

Example:

```js
const { SlashCommandManager } = require("ic4d");

const command = new SlashCommandManager(/* command cofig */).setDeleted(true);
module.exports = command;
```

### `addInteractions`

Appends related interactions to the slash command, only way for slash commands and other interactions to appear in the same file.

-   `...interactions`**: [InteractionBuilder](#interactionbuilder)[]**
    -   Rest paramater of [InteractionBuilder](#interactionbuilder)

**_`returns`: [self](#slashcommandmanager)_**

```js
const { SlashCommandManager, InteractionBuilder } = require("ic4d");

const command = new SlashCommandManager(/* command cofig */).addInteractions(
    new InteractionBuilder() /*...*/
);
module.exports = command;
```

# InteractionBuilder

Represents a single interaction that isn't a chat input (slash command) or context menu. (This class can however be passed into a rest parameter in [SlashCommandManager](#slashcommandmanager) or in it's own separate file by itself.)
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
yay. (I hate documenting.)

## Methods

### `setCustomId`

Sets the custom ID of the interaction.

-   `customId`**: string**
    -   Custom ID of the interaction.

**_`returns`: [self](#interactionbuilder)_**

```js
const button = new InteractionBuilder().setCustomId("my-cool-button");
```

### `setType`

Sets the type of the interaction. (Either "selectMenu", "button" or "modal")

-   `type`: [InteractionTypeStrings](#interactiontypestrings)
    -   Type of the interaction.

**_`returns`: [self](#interactionbuilder)_**

```js
const selectMenu = new InteractionBuilder().setType("selectMenu");
```

### `setCallback`

Function to be called when the interaction is called. (Is that how you say it?)

-   `fn`**: (
    interaction: [InteractionTypeStringsMap<this["type"]>](#interactiontypestringsmap),
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)
    ) => void | Promise\<void>**
    -   The function to be called (Parameters: `(interaction, client)`)

**_`returns`: [self](#interactionbuilder)_**

```js
const selectMenu = new InteractionBuilder().setCallback((i) => {
    i.update("Client parameter is optional");
});
```

### `setOnlyAuthor`

Set whether or not the interaction can only be interacted with by the author of the interaction.

-   `bool`**: boolean**
    -   If true, the interaction only accepts the author's input.

**_`returns`: [self](#interactionbuilder)_**

```js
const button = new InteractionBuilder().setOnlyAuthor(true);
```

### `setTimeout`

Sets the interaction to have a timeout.

-   `fn`**:(
    interaction: [ChatInputCommandInteraction](https://discord.js.org/docs/packages/discord.js/main/ChatInputCommandInteraction:Class),
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)
    ) => void | Promise\<void>**
    -   Function to call when the interaction time expires.
-   `timeout`**: number**
    -   How long to wait for the interaction to timeout. (in ms)

**_`returns`: [self](#interactionbuilder)_**

```js
const a = new InteractionBuilder().setTimeout((i) => {
    i.editReply("Damn the time expired brodie");
}, 10_000);
```

# ContextMenuBuilder

Builder for context menus, since they are special.

## Constructor

-   `context`**: {
    data: [ContextMenuCommandBuilder](https://discord.js.org/docs/packages/builders/main/ContextMenuCommandBuilder:Class);
    execute: (
    interaction: [ContextMenuCommandInteraction](https://discord.js.org/docs/packages/discord.js/main/ContextMenuCommandInteraction:Class),
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)
    ) => void;
    }**
    -   Object with 2 properties, a `data` property that is an instance of `ContextMenuBuilder` provided by discord.js and a function called `execute` to execute when the context menu is called.

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

-   `deleted`**: boolean**
    -   Boolean indicating whether the context menu is deleted.

**_`returns`: [self](#contextmenubuilder)_**

```js
const user = new ContextMenuBuilder().setDeleted(true);
```

# RunFlags

An interface representing the configuration flags used for running commands in the bot.

This configuration is specifically used to control various runtime aspects of command execution.

## Properties

### **_testGuildId: string_**

```
Default value: undefined
```

The ID of the test guild for command testing purposes. If provided, commands will be deployed only to this guild.

### **_devs: string[]_**

```
Default value: []
```

An array of Discord user IDs (snowflakes) that have developer privileges.

Commands or functionalities restricted to developers will be accessible to users with IDs in this array.

### **_onlyDev: string_**

```
Default value: "Only developers are allowed to run this command."
```

The message shown when a command restricted to developers is executed by a non-developer.

### **_userNoPerms: string_**

```
Default value: "Not enough permissions."
```

The message displayed when a user lacks the necessary permissions to execute a command.

### **_botNoPerms: string_**

```
Default value: "I don't have enough permissions."
```

The message displayed when the bot lacks the necessary permissions to execute a command.

## Exmaple Use

```ts
const obj: RunFlags = {
    testGuildId: "808701451399725116",
    devs: ["671549251024584725"],

    onlyDev: "Text to display when a user runs a developer command.",
    userNoPerms: "Text to display when the user has insufficient permissions",
    botNoPerms: "Text to display when the bot has insufficient permissions",
};
```

# HandlerFlags

An interface that represents anything you can do with the commands when they are run, BUT before YOUR code executes.

## Properties

### **_debugger: boolean_**

```
Default value: false
```

Enable debugger mode. Prints(almost) everything that happens behind the scenes of course not with the API itself.

### **_disableLogs: boolean_**

```
Default value: false
```

Disabling Logging of the Command Loader. Not advisable but hey it's your bot.

### **_production: boolean_**

```
Default value: false
```

Whether or not this is the production version of the bot. If set to true, commands labelled `isDev` will NOT be loaded. (Use the `setDev()` method in [SlashCommandManager](#slashcommandmanager))

### **_refreshApplicationCommands: boolean_**

```
Default value: false
```

Clears ALL application commands on startup. (Slash commands, User commands, and Message commands.)

### **_logToFile: string | false_**

```
Default value: false
```

When debugger mode is enabled, Either log to console or a file.

## Example Use

```ts
const obj: LoaderOptions = {
    debugger: true,
    production: true,
    disableLogs: true,
};
```

# InteractionHandlerFlags

An interface that represents anything you can do with the interactions when they are run, BUT before YOUR code executes.

## Properties

### **_debugger: boolean_**

```
Default value: false
```

Enable Debugger mode. Prints (almost) everything that happens behind the scenes of course not with the API itself.

### **_disableLogs: boolean_**

```
Default value: false
```

Disabling Logging of the Context Menu Loader. Not advised but hey it's your bot. Default is false.

### **_refreshContextMenus: boolean_**

```
Default value: false
```

Clears Context Menus

### **_logToFile: string | false_**

```
Default value: false
```

When debugger mode is enabled, Either log to console or a file.

# LoaderOptions

Interface that represents default string values for the loader to log to the console when it encounters a command/context menu.

Make sure you keep `NAME` in the string or else you will not know what happened to which command.
If there is no log in the console for a specific command, then it has been loaded, there are no edits and it has not been deleted.

## Properties

Note:

> These have multiple default values, as context menus and commands are different.

### **_loaded: string_**

What to show for context menus/commands that load in

### **_edited: string_**

What to show for context menus/commands that gets edited.

### **_deleted: string_**

What to show for context menus/commands that gets deleted.

### **_skipped: string_**

What to show for context menus/commands that gets skipped. (Deleted and still marked as deleted.)

### **_loadedNoChanges: string_**

What to show for context menus/commands that gets loaded, but has no changes

## Example Use

```ts
const obj: LoaderOptions = {
    loadedNoChanges: "NAME was loaded. No changes were made to NAME.",
    loaded: "NAME has been registered successfully.",
    edited: "NAME has been edited.",
    deleted: "NAME has been deleted.",
    skipped: "NAME was skipped. (Command deleted or set to delete.)",
};
```

# InteractionTypeStrings

Type alias for the strings `"selectMenu"`, `"modal"` and `"button"`

Yes this did not need documenting, but here it is.

# InteractionTypeStringsMap

Here's the exact definition because I genuinely don't know how to explain this.

```ts
export type InteractionTypeStringsMap<U extends string> = U extends "modal"
    ? ModalSubmitInteraction
    : U extends "selectMenu"
    ? AnySelectMenuInteraction
    : U extends "button"
    ? ButtonInteraction
    : never;
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
