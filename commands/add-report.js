import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } from 'discord.js';
import Project from '../models/Project.js'; 
import Role from '../models/Role.js';

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    try {
        const [projects, roles] = await Promise.all([
            Project.find(),
            Role.find()
        ]);

        if (projects.length === 0) {
            return interaction.reply({
                content: 'No projects exist in the database. Use `/add-project` first.',
                ephemeral: true
            });
        }

        const prEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('Submit Daily Scrum Report')
            .setDescription('Select **Project** and **Role** below to start: ');

        const projectMenu = new StringSelectMenuBuilder()
            .setCustomId('project_select')
            .setPlaceholder('Select a project')
            .addOptions(projects.map(proj => ({ label: proj.name, value: proj.name })));
        
        const roleMenu = new StringSelectMenuBuilder()
            .setCustomId('role_select')
            .setPlaceholder('Select your role')
            .addOptions(roles.map(role => ({ label: role.name, value: role.name })));

        const writeButton = new ButtonBuilder()
            .setCustomId('open_report_modal')
            .setLabel('Write Report')
            .setStyle('Success')
            .setDisabled(true);

        await interaction.reply({
            embeds: [prEmbed],
            components: [
                new ActionRowBuilder().addComponents(projectMenu),
                new ActionRowBuilder().addComponents(roleMenu),
                new ActionRowBuilder().addComponents(writeButton)
            ],
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