import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

const commands = [
    new SlashCommandBuilder()
        .setName('add-report')
        .setDescription('Submit your daily scrum report'),
    new SlashCommandBuilder()
        .setName('add-project')
        .setDescription('Add a new project to the list')
        .addStringOption(option => 
            option.setName('project_name')
                .setDescription('The name of the project')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('scrum-update')
        .setDescription('View today\'s updates, plans, and impediments for a selected project')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Commands registered successfully!');
    } catch (error) {
        console.error(error);
    }
})();