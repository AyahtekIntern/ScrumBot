import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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
    
    projects.push(projectName);

    const projectEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('Project Added')
        .setDescription(`Project **${projectName}** has been added to the list.`);

    await interaction.reply({
        embeds: [projectEmbed],
        ephemeral: true
    });
}