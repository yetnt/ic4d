# ic4d

**I**nteractions and **C**ommand handler **4** **D**ummies

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

-   [ic4d](#ic4d)
-   [Installation](#installation)
-   [Contents](#contents) _You are here_
-   [Quick Example](#quick-example)
-   Classes
    -   [CoreHandler](#corehandler)
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

Refer [here](#sharding) for the sharding version of index.js

```js
require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const path = require("path");

const { CommandHandler, ReadyHandler, CoreHandler } = require("ic4d");

const commandsPath = path.join(__dirname, "..", "commands");
const logpath = path.join(__dirname, "..", "logs");

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

const core = new CoreHandler(client, logPath);

const handler = new CommandHandler(core, commandsPath, runFlags);
const ready = new ReadyHandler(
    core,
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

# CoreHandler

This is a class which is needed as the first parameter of the `ReadyHandler`, `CommandHandler` and `InteractionHandler` constructors.

You don't need to use or touch any of the methods and properties in this class. Do that and your bot may not work lol

## Constructor

-   `client`**: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)**
    -   **(optional)** Discord.js Client Instance.
-   `logToFolder`**: string | false**
    -   **(optional)** Default folder to log to.

```js
const { CoreHandler } = require("ic4d");
const { Client } = require("discord.js");

const client = new Client();

const core = new CoreHandler(client, "./logs");
```

# ReadyHandler

Ready handler is a handler that runs a set of functions when the bot starts.

## Constructor

-   `core`**:[CoreHandler](#corehandler)**
    -   CoreHandler instance.
-   `...functions`**: ((client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class)) => Promise\<void> | void )[] = []**
    -   Functions to run when the `execute()` method is called, and the ready event has been emitted. Functions may take one parameter (client) or none.

```js
const { ReadyHandler, CoreHandler } = require("ic4d");

const core = new CoreHandler(client, "./logs");

const ready = new ReadyHandler(
    core
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

-   `core`**:[CoreHandler](#corehandler)**
    -   CoreHandler instance.
-   `path`**: string**
    -   Path in which your exported command objects are stored. The handler will **not** work if you do not use path.
-   `runFlags`**: [RunFlags](#runflags)**
    -   **(optional)** Command Reader Options
-   `loaderOptions`**: [LoaderOptions](#loaderoptions)**
    -   **(optional)** Command Loader Options
-   `handlerFlags`**: [HandlerFlags](#handlerflags)**
    -   **(optional)** Injection Options. (flags to set which do something while commandHandler is running)

```js
const { CommandHandler, CoreHandler } = require("ic4d");
const path = require("path");

const core = new CoreHandler(client, "./logs");

const handler = new CommandHandler(core, path.join(__dirname, "commands"));
```

## Methods

### `registerCommands()`

**(asynchronous function)**

-   `logNoChanges`**: boolean**
    -   **(optional)** Log when loading a command and no changes are made
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
    -   Functions to run BEFORE a command is run.
-   `postWare`**: ( ( commandObject: Object, interaction?: [ChatInputCommandInteraction](https://discord.js.org/docs/packages/discord.js/main/ChatInputCommandInteraction:Class) ) => any )[]**
    -   Functions to run AFTER the command's callback has been called.

```js
const handler = new CommandHandler(core, path.join(__dirname, "commands"));

const blacklisted = ["302983482377931"];
const blacklist = (commandObject, interaction) => {
    if (commandObject.blacklist && blacklisted.includes(interaction.user.id)) {
        interaction.reply({
            content: "Daang you blacklisted my guy.",
            ephemeral: true,
        });
        return 1;
    }
    return 0;
};

const addXp = (commandObject, interaction) => {
    if (commandObject.category != "economy") return;

    interaction.reply({
        content: "Ayo! Free Xp +2",
        ephemeral: true,
    });
};

await handler.handleCommands([blacklist], [addXp]);
```

#### Middleware Parameters and use

> [!NOTE]  
> This is ONLY for `middleWare` and does NOT apply to `postWare` functions.
> It does not matter what `postWare` functions return as ic4d does not use that value at all.

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

-   `core`**:[CoreHandler](#corehandler)**
    -   CoreHandler instance.
-   `path`**: string**
    -   Path to where interactions are stored.
-   `loaderOptions`**: [LoaderOptions](#loaderoptions)**
    -   **(optional)** Context Menu Loader Options
-   `flags`**: [InteractionHandlerFlags](#interactionhandlerflags)**
    -   **(optional)** Interaction Handler Flags

```js
const { InteractionHandler, CoreHandler } = require("ic4d");
const path = require("path");

const core = new CoreHandler(client, "./logs");

const interactions = new InteractionHandler(
    core,
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
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class),
    addInteractionVariables?: (k: { [key: string]: any }) => void
    ) => void | Promise\<void>**
    -   Command's data, Only takes in 2 properties: `data` property which contains the command's data from the discord.js provided class `SlashCommandBuilder` and the `execute` property which takes in a function with the `interaction` and `client` parameter.
    -   `addInteractionVaribles` is a function that can be used in the execute method to pass variables to buttons, modals and select menus (See [here](#addinteractionvariables-method-3))

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
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class),
    variables?: { [key:string]: any }
    ) => void | Promise\<void>**
    -   The function to be called (Parameters: `(interaction, client, variables)`)
    -   (See [here](#addinteractionvariables-method-3) for variables param)

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
    client?: [Client](https://discord.js.org/docs/packages/discord.js/main/Client:Class),
    variables?: { [key:string]: any }
    ) => void | Promise\<void>**
    -   Function to call when the interaction time expires.
    -   (See [here](#addinteractionvariables-method-3) for variables param)
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

### **_logToFolder: string | false_**

```
Default value: (CoreHandler value) or false
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

### **_logToFolder: string | false_**

```
Default value: (CoreHandler value) or false
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

## Sharding

This is the exact same code from [Quick Example](#quick-example) except it's sharding compatible

```js
require("dotenv").config();
const { Client, IntentsBitField, ShardingManager } = require("discord.js");
const path = require("path");

const { CommandHandler, ReadyHandler, CoreHandler } = require("ic4d");

const commandsPath = path.join(__dirname, "..", "commands");
const logPath = path.join(__dirname, "..", "logs");

const runFlags = {
    devs: ["671549251024584725"],
    testGuildId: "808701451399725116",
};

// Use ShardingManager to manage shards
const manager = new ShardingManager(__filename, {
    token: process.env.TOKEN,
    totalShards: "auto", // Discord.js will automatically decide shard count
});

manager.on("shardCreate", (shard) => {
    console.log(`Shard ${shard.id} launched.`);
});

// Core bot logic for each shard
if (!process.env.SHARDING_MANAGER) {
    const client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
        ],
    });

    const core = new CoreHandler(client, logPath);

    const ready = new ReadyHandler(
        core
        async (shardClient) => {
            console.log(`${shardClient.user.tag} is ready!`);
        },
        async () => {
            await handler.registerCommands();
        }
    );

    const handler = new CommandHandler(
        core,
        commandsPath,
        runFlags
    );

    (async () => {
        await client.login(process.env.TOKEN);
        ready.execute();
        await handler.handleCommands();
    })();
}

// Launch all shards
manager.spawn();
```

## Sharing variables between slash and interactions

-   Example: You have where a variable needs to be shared from the slash command callback to the interaction callback. Here there are 3 methods (1 being the recommended approach)

### Method 1 & 2 (Not recommended)

Method 1 involves:

> Setting and retrieving an outside variable which the slash and interaction callback can receive

Method 2 involves:

> Adding a property to the slash command object itself and retrieving that property later in the interaction callback.

```js
// method 1
let variable = "";

const test = new SlashCommandManager({
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Just a test")
        .addStringOption((option) =>
            option
                .setName("string")
                .setDescription("some input")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const itemName = interaction.options.get("string").value;

            // method 1 (global variable)
            variable = itemName;

            // method 2 (adding a property)
            test.variable = itemName;

            await interaction.editReply({
                content: "Huh?",
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("hello")
                            .setLabel("click now")
                            .setStyle(ButtonStyle.Primary)
                    ),
                ],
            });
        } catch (e) {
            errorHandler(e, client, interaction, EmbedBuilder);
        }
    },
}).addInteractions(button);

const button = new InteractionBuilder()
    .setType("button")
    .setCustomId("hello")

    .setCallback(async (i, c) => {
        // method 1
        const itemName = variable;

        //method 2
        const itemName = test.variable;
        await i.update({ content: itemName, components: [] });
    });

module.exports = test;
```

Method 1 issue:

> **Concurrency issues:** The main problem with this method is that if multiple users run the command simultaneously, the variable is overwritten by the most recent execution. This means that data intended for one user could be exposed or altered by another user’s command, leading to unexpected behavior and security issues.

Method 2 issue(s):

> **Shared State:** Although this method keeps the variable associated with the specific command object, it still doesn't address the issue of multiple users running the command. If two users execute the command, the stored value will change to reflect the most recent one, causing similar issues to the global variable method.
>
> **Not Scoped Per Interaction:** This approach doesn’t effectively isolate variables for individual interactions, which can lead to data being inadvertently shared between users.

### addInteractionVariables() (method 3)

This uses a new function passed into [SlashCommandManager execute function (in the constructor object)](#constructor-3), which you can use to pass anything to the interactions associated with this command.
(Returns void);

-   `k`**: { [key: string]: any }**
    -   Object of variables to save and be referenced later in interactions associated with this command.

Then to use these variables, in either the [setCallback](#setcallback) or [setTimeout](#settimeout) method of the [InteractionBuilder](#interactionbuilder), add the optional parameter `variables` which returns the object you passed (hopefully)

Example:

```js
const test = new SlashCommandManager({
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Just a test")
        .addStringOption((option) =>
            option
                .setName("string")
                .setDescription("some input")
                .setRequired(true)
        ),
    // here we add the function in the parameter list
    async execute(interaction, client, addInteractionVariables) {
        try {
            await interaction.deferReply();
            const itemName = interaction.options.get("string").value;
            await interaction.editReply({
                content: "Huh?",
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("hello")
                            .setLabel("click now")
                            .setStyle(ButtonStyle.Primary)
                    ),
                ],
            });

            // using the function
            addInteractionVariables({ itemName });
        } catch (e) {
            errorHandler(e, client, interaction, EmbedBuilder);
        }
    },
}).addInteractions(button);

const button = new InteractionBuilder()
    .setType("button")
    .setCustomId("hello")

    // add the variables to the parameter list
    .setCallback(async (i, c, variables) => {
        // using the variable in the callback
        await i.update({ content: variables.itemName, components: [] });
    });
```

This method will always find the variables associated with the message sent by the bot. (This method may not work if you have something like a modal before a bot response as it uses the messageId as a unique identifier.)

> **(Better explanation)** `addInteractionVariables()` function ties variables to unique message Ids AND the custom IDs of the slash command, ensuring that data remains scoped to specific interactions and is not shared or overwritten between users. This approach enhances data safety by preventing concurrency issues and ensuring only the relevant interaction can access its data. It also sorta simplifies the process of passing data between commands and interactions

If any of the approaches don't help your use case. It's always best to just use [Message collectors](https://discordjs.guide/popular-topics/collectors)

## CommandHandler Reading the wrong files

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

    -   Usually, the reader should skip over anything it can't read, but if needed, this will immediately make it skip.

# Credits

Huge credit to [underctrl](https://github.com/notunderctrl), Code would've not been possible if i did not watch his helpful discord.js tutorials! I had to give him credit because this package is based off moving all those files fromm his tutorial into one package.

He probably has a way better package, so go check his out!

# Links

-   [Github](https://github.com/YetNT/ic4d)
-   [NPM](https://www.npmjs.com/package/ic4d)
-   [underctrl Discord.js Tutorial](https://www.youtube.com/playlist?list=PLpmb-7WxPhe0ZVpH9pxT5MtC4heqej8Es)
