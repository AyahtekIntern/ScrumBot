import { SlashCommandBuilder } from 'discord.js';
import { projects } from '../data.js';

export const data = new SlashCommandBuilder()
    .setName('add-project')
    .setDescription('Add a new project to the list')
    .addStringOption(option => 
        option.setName('project_name')
            .setDescription('The name of the project')
            .setRequired(true));

export async function execute(interaction) {
    const projectName = interaction.options.getString('project_name');
    
    // Add to the global projects list in data.js
    projects.push(projectName);

    await interaction.reply({
        content: `Project **${projectName}** added successfully!`,
        ephemeral: true
    });
}