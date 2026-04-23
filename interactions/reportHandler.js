import { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { roles, reports } from '../data.js';

export async function handleProjectSelect(interaction) {
    const selectedProject = interaction.values[0];
    const roleMenu = new StringSelectMenuBuilder()
        .setCustomId(`role_select_${selectedProject}`)
        .setPlaceholder('Select your role')
        .addOptions(roles.map(role => ({ label: role, value: role })));

    await interaction.update({
        content: `Project: **${selectedProject}**. Now select your role:`,
        components: [new ActionRowBuilder().addComponents(roleMenu)],
        ephemeral: true
    });
}

export async function handleRoleSelect(interaction) {
    const selectedProject = interaction.customId.split('_')[2];
    const selectedRole = interaction.values[0];

    const modal = new ModalBuilder()
        .setCustomId(`report_modal_${selectedProject}_${selectedRole}`)
        .setTitle(`Scrum: ${selectedProject}`);

    const updateInput = new TextInputBuilder().setCustomId('update_input').setLabel('Updates').setStyle(TextInputStyle.Paragraph);
    const planInput = new TextInputBuilder().setCustomId('plan_input').setLabel('Plans').setStyle(TextInputStyle.Paragraph);
    const blockersInput = new TextInputBuilder().setCustomId('blockers_input').setLabel('Blockers').setStyle(TextInputStyle.Paragraph).setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(updateInput),
            new ActionRowBuilder().addComponents(planInput),
            new ActionRowBuilder().addComponents(blockersInput)
        );


    await interaction.showModal(modal);
}

export async function handleModalSubmit(interaction) {
    const [, , projectName, role] = interaction.customId.split('_');
    const update = interaction.fields.getTextInputValue('update_input');

    reports.push({
        username: interaction.user.username,
        userId: interaction.member.id,
        project: projectName,
        role: role,
        timestamp: new Date()
    });

    await interaction.reply({ content: `Report submitted for **${projectName}**!`, ephemeral: true });
}