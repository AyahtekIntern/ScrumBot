import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as addReport from './commands/add-report.js';
import * as addProject from './commands/add-project.js';
import * as scrumUpdate from './commands/scrum-update.js';
import * as reportHandler from './interactions/reportHandler.js';
import * as scrumUpdateHandler from './interactions/scrumUpdateHandler.js';
import * as scrumMessage from './events/messageCreate.js';
import * as helpMessage from './events/helpMessage.js';
import mongoose from 'mongoose';




const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
        family: 4 // Forces IPv4 DNS resolution
    });
    console.log('Connected to MongoDB successfully.');
    } catch (error) {
        console.log('Error connecting to MongoDB:', error);
    }
});

client.commands = new Collection();
client.commands.set(addReport.data.name, addReport);
client.commands.set(addProject.data.name, addProject);
client.commands.set(scrumUpdate.data.name, scrumUpdate);

client.on('messageCreate', scrumMessage.execute );
client.on('messageCreate', helpMessage.execute );

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'project_select' || interaction.customId === 'role_select') {
            await reportHandler.handleSelection(interaction);
        }

        if (interaction.customId === 'scrum_update_project_select') {
            await scrumUpdateHandler.handleProjectSelect(interaction);
        }
    }

    if (interaction.isButton() && interaction.customId === 'open_report_modal') {
        await reportHandler.handleOpenModal(interaction);
    }

    if (interaction.isButton() && interaction.customId.startsWith('scrum_update_view_')) {
        await scrumUpdateHandler.handleViewToggle(interaction);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('report_modal_')) {
        await reportHandler.handleModalSubmit(interaction);
    }

});

client.login(process.env.DISCORD_TOKEN);