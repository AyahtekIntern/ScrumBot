import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import Project from '../models/Project.js'; 

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    try {
        // Fetch all projects from MongoDB
        const projects = await Project.find();

        if (projects.length === 0) {
            return interaction.reply({
                content: 'No projects exist in the database. Use `/add-project` first.',
                ephemeral: true
            });
        }

        // Map the database results to the Discord Select Menu format
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('project_select')
            .setPlaceholder('Select a project')
            .addOptions(
                projects.map(proj => ({ 
                    label: proj.name, 
                    value: proj.name 
                }))
            );

        await interaction.reply({
            content: 'Select a project:',
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true
        });

    } catch (error) {
        console.error('Database error in add-report:', error);
        await interaction.reply({
            content: 'Failed to retrieve projects from the database.',
            ephemeral: true
        });
    }
}