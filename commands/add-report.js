import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { projects, roles } from '../data.js';

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    
    const prEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('Add Scrum Report')
        .setDescription('Please select your Project and Role before writing your report.');

    const projectMenu = new StringSelectMenuBuilder()
        .setCustomId('project_select')
        .setPlaceholder('Select a project')
        .addOptions(projects.map(proj => ({ label: proj, value: proj })));

    const roleMenu = new StringSelectMenuBuilder()
        .setCustomId('role_select')
        .setPlaceholder('Select your role')
        .addOptions(roles.map(role => ({ label: role, value: role })));

    const writeButton = new ButtonBuilder()
        .setCustomId('open_report_modal')
        .setLabel('Write Report')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true);
    
    const row1 = new ActionRowBuilder().addComponents(projectMenu);
    const row2 = new ActionRowBuilder().addComponents(roleMenu);
    const row3 = new ActionRowBuilder().addComponents(writeButton);

    await interaction.reply({
        embeds: [prEmbed],
        components: [row1, row2, row3],
        ephemeral: true
    });
}