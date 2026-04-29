import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as addReport from './commands/add-report.js';
import * as scrumCmd from './commands/scrum.js'
import * as scrumUpdate from './commands/scrum-update.js';
import * as reportHandler from './interactions/reportHandler.js';
import * as scrumUpdateHandler from './interactions/scrumUpdateHandler.js';
import * as helpMessage from './events/helpMessage.js';
import * as scrumHandler from './interactions/scrumHandler.js'
import mongoose from 'mongoose';


const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
        family: 4
    });
    console.log('Connected to MongoDB successfully.');
    } catch (error) {
        console.log('Error connecting to MongoDB:', error);
    }
});

client.commands = new Collection();
client.commands.set(addReport.data.name, addReport);
client.commands.set(scrumCmd.data.name, scrumCmd);
client.commands.set(scrumUpdate.data.name, scrumUpdate);

client.on('messageCreate', helpMessage.execute );

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'project_select' || interaction.customId === 'role_select') {
            return await reportHandler.handleSelection(interaction);
        }
        if (interaction.customId === 'scrum_update_project_select') {
            await scrumUpdateHandler.handleProjectSelect(interaction);
        }
        if (interaction.customId.startsWith('scrum_edit_') || interaction.customId.startsWith('scrum_delete_')) {
            return await scrumHandler.handleSelection(interaction);
        }

    }

    if (interaction.isButton()) {
        if (interaction.customId === 'open_report_modal' || interaction.customId === 'update_report_modal') {
            return await reportHandler.handleOpenModal(interaction);
        }

        if (interaction.customId === 'scrum_update_open_date_modal') {
            return await scrumUpdateHandler.handleOpenDateModal(interaction);
        }

        if (interaction.customId.startsWith('scrum_update_view_')) {
            return await scrumUpdateHandler.handleViewToggle(interaction);
        }

        if (interaction.customId.startsWith('scrum_')) {
            return await scrumHandler.handleButtons(interaction);
        }
        
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('report_modal_')) {
            return await reportHandler.handleModalSubmit(interaction);
        }
        if (interaction.customId.startsWith('scrum_update_date_modal_')) {
            return await scrumUpdateHandler.handleDateModalSubmit(interaction);
        }
        if (interaction.customId.startsWith('modal_add_') || interaction.customId.startsWith('modal_edit_')) {
            return await scrumHandler.handleModalSubmit(interaction);
        }
    }

});

client.login(process.env.DISCORD_TOKEN);