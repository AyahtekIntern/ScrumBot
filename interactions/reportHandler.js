import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } from 'discord.js';
import Report from '../models/Report.js';
import Role from '../models/Role.js'; 

export async function handleProjectSelect(interaction) {
    const selectedProject = interaction.values[0];

    try {
        // Fetch available roles from MongoDB
        const rolesData = await Role.find();

        if (rolesData.length === 0) {
            return interaction.update({
                content: `Project: **${selectedProject}**. \n\n**Error:** No roles exist in the database. You must add roles before users can submit reports.`,
                components: [],
                ephemeral: true
            });
        }

        const roleMenu = new StringSelectMenuBuilder()
            .setCustomId(`role_select_${selectedProject}`)
            .setPlaceholder('Select your role')
            // Map the database documents to the Discord Select Menu options
            .addOptions(rolesData.map(role => ({ label: role.name, value: role.name })));

        await interaction.update({
            content: `Project: **${selectedProject}**. Now select your role:`,
            components: [new ActionRowBuilder().addComponents(roleMenu)],
            ephemeral: true
        });

    } catch (error) {
        console.error('Database error fetching roles:', error);
        await interaction.update({ 
            content: 'Failed to retrieve roles from the database.', 
            components: [], 
            ephemeral: true 
        });
    }
}

export async function handleOpenModal(interaction) {
    const project = interaction.message.components[0].components[0].placeholder.split(': ')[1];
    const role = interaction.message.components[1].components[0].placeholder.split(': ')[1];

    const modal = new ModalBuilder()
        .setCustomId(`report_modal_${project}_${role}`)
        .setTitle(`${project} - Daily Update`);

    const updateInput = new TextInputBuilder()
        .setCustomId('update_input')
        .setLabel('Updates')
        .setStyle(TextInputStyle.Paragraph);
        
    const planInput = new TextInputBuilder()
        .setCustomId('plan_input')
        .setLabel('Plans')
        .setStyle(TextInputStyle.Paragraph);
        
    // Updated label and ID to align with convention
    const impedimentsInput = new TextInputBuilder()
        .setCustomId('impediments_input') 
        .setLabel('Impediments')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(updateInput),
        new ActionRowBuilder().addComponents(planInput),
        new ActionRowBuilder().addComponents(impedimentsInput)
    );

    await interaction.showModal(modal);

}


export async function handleModalSubmit(interaction) {
    const [, , projectName, role] = interaction.customId.split('_');
    
    const updates = interaction.fields.getTextInputValue('update_input');
    const plans = interaction.fields.getTextInputValue('plan_input');
    // Extract using the new ID
    const impediments = interaction.fields.getTextInputValue('impediments_input') || "None"; 

    try {
        await Report.create({
            username: interaction.user.username,
            projectName: projectName,
            role: role,
            updates: updates,
            plans: plans,
            impediments: impediments
        });

        await interaction.reply({ content: `Report submitted for **${projectName}**!`, ephemeral: true });
    } catch (error) {
        console.error('Database error in handleModalSubmit:', error);
        await interaction.reply({ content: 'An error occurred while saving your report to the database.', ephemeral: true });
    }
}