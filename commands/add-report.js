import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { projects } from '../data.js';

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('project_select')
        .setPlaceholder('Select a project')
        .addOptions(projects.map(proj => ({ label: proj, value: proj })));

    await interaction.reply({
        content: 'Select a project:',
        components: [new ActionRowBuilder().addComponents(selectMenu)],
        ephemeral: true
    });
}