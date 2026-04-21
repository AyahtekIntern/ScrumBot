import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { projects } from './data.js';
import * as addReport from './commands/add-report.js';
import * as addProject from './commands/add-project.js';
import * as reportHandler from './interactions/reportHandler.js';
import * as scrumUpdate from './events/messageCreate.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();
client.commands.set(addReport.data.name, addReport);
client.commands.set(addProject.data.name, addProject);

client.on('messageCreate', scrumUpdate.execute);

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'project_select') await reportHandler.handleProjectSelect(interaction);
        if (interaction.customId.startsWith('role_select_')) await reportHandler.handleRoleSelect(interaction);
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('report_modal_')) await reportHandler.handleModalSubmit(interaction);
    }
});

client.login(process.env.DISCORD_TOKEN);