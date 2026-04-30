import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import 'dotenv/config';

const commands = [
    new SlashCommandBuilder()
        .setName('scrum')
        .setDescription('Show list of all existing projects and roles'),

    new SlashCommandBuilder()
        .setName('scrum-update')
        .setDescription('View today\'s updates, plans, and impediments for a selected project'),

    new SlashCommandBuilder()
        .setName('add-report')
        .setDescription('Submit your daily scrum report'),

    new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete reports within a specified date range")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false)
        
        
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