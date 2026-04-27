import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Project from '../models/Project.js'; 

export const data = new SlashCommandBuilder()
    .setName('add-project')
    .setDescription('Add a new project to the list')
    .addStringOption(option => 
        option.setName('project_name')
            .setDescription('The name of the project')
            .setRequired(true));

export async function execute(interaction) {
    const projectName = interaction.options.getString('project_name');
    
    try {
        const existingProject = await Project.findOne({ name: projectName });
        if (existingProject) {
            return interaction.reply({
                content: `The project **${projectName}** already exists in the database.`,
                ephemeral: true
            });
        }
        await Project.create({ name: projectName });

        const projectEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('Project Added')
            .setDescription(`Project **${projectName}** has been added to the database.`);

        await interaction.reply({
            embeds: [projectEmbed],
            ephemeral: true
        });

    } catch (error) {
        console.error('Database error in add-project:', error);
        await interaction.reply({
            content: 'An error occurred while saving to the database.',
            ephemeral: true
        });
    }
}