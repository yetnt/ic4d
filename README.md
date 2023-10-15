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

# Documentation is coming soon!
