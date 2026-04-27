import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import Report from '../models/Report.js';

function getTodayInputValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseLocalDateInput(dateInput) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return null;
    }

    const [yearStr, monthStr, dayStr] = dateInput.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    const parsed = new Date(year, month - 1, day);

    // Reject invalid calendar dates like 2026-02-30.
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

export async function handleSelection(interaction) {

    if (!interaction.isStringSelectMenu()) return;
    const rawComponents = interaction.message?.components ?? interaction.message?.data?.components;
    const selectedValue = interaction.values[0];
    const isProject = interaction.customId === 'project_select';

    if (!Array.isArray(rawComponents) || rawComponents.length === 0) {
        console.error('handleSelection: missing interaction message components', {
            customId: interaction.customId,
            message: interaction.message
        });
        return await interaction.reply({
            content: 'Unable to update your selection. Please try again.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const actionRows = rawComponents[0]?.type === 17 && Array.isArray(rawComponents[0].components)
        ? rawComponents[0].components.filter(row => row.type === 1)
        : rawComponents.filter(row => row.type === 1);

    const newRows = actionRows.map((row, index) => {
        const actionRow = ActionRowBuilder.from(row);
        
        if ((isProject && index === 0) || (!isProject && index === 1)) {
            const menu = StringSelectMenuBuilder.from(row.components[0])
                .setPlaceholder(`Selected: ${selectedValue}`);
            actionRow.setComponents(menu);
        }
        return actionRow;
    });

    const projPlaceholder = newRows[0].components[0].data.placeholder;
    const rolePlaceholder = newRows[1].components[0].data.placeholder;
    const isReady = projPlaceholder.includes('Selected:') && rolePlaceholder.includes('Selected:');

    if (isReady) {
        const enabledButton = ButtonBuilder.from(newRows[2].components[0]).setDisabled(false);
        newRows[2].setComponents(enabledButton);
    }

    await interaction.update({ 
        components: [{ type: 17, components: newRows }] 
    });
}


export async function handleOpenModal(interaction) {
    const rawComponents = interaction.message?.components ?? interaction.message?.data?.components;
    const actionRows = rawComponents?.[0]?.type === 17 && Array.isArray(rawComponents[0].components)
        ? rawComponents[0].components.filter(row => row.type === 1)
        : rawComponents?.filter(row => row.type === 1);

    if (!Array.isArray(actionRows) || actionRows.length < 2) {
        console.error('handleOpenModal: invalid message components', {
            customId: interaction.customId,
            message: interaction.message
        });
        return interaction.reply({
            content: 'Unable to open the report modal. Please try again.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const project = actionRows[0].components[0].placeholder.split(': ')[1];
    const role = actionRows[1].components[0].placeholder.split(': ')[1];

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
        
    const impedimentsInput = new TextInputBuilder()
        .setCustomId('impediments_input') 
        .setLabel('Impediments')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const reportDateInput = new TextInputBuilder()
        .setCustomId('report_date_input')
        .setLabel('Report date (YYYY-MM-DD)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(getTodayInputValue())
        .setValue(getTodayInputValue())
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(updateInput),
        new ActionRowBuilder().addComponents(planInput),
        new ActionRowBuilder().addComponents(impedimentsInput),
        new ActionRowBuilder().addComponents(reportDateInput)
    );

    await interaction.showModal(modal);

}


export async function handleModalSubmit(interaction) {
    const parts = interaction.customId.split('_');

    const role = parts.pop();
    const projectName = parts.slice(2).join('_');
    
    const updates = interaction.fields.getTextInputValue('update_input');
    const plans = interaction.fields.getTextInputValue('plan_input');
    const impediments = interaction.fields.getTextInputValue('impediments_input') || 'None';
    const reportDateInput = interaction.fields.getTextInputValue('report_date_input').trim();
    const reportDate = parseLocalDateInput(reportDateInput);

    if (!reportDate) {
        return interaction.reply({
            content: 'Invalid date format. Please use YYYY-MM-DD.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    try {
        await Report.create({
            username: interaction.user.username,
            projectName: projectName,
            role: role,
            updates: updates,
            plans: plans,
            impediments: impediments,
            date: reportDate
        });

        const successEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('Scrum Report Submitted')
            .setDescription(`Successfully saved update for **${projectName}**.`)
            .addFields(
                { name: 'Role', value: role, inline: true },
                { name: 'User', value: interaction.member.displayName || interaction.user.username, inline: true }
            )
            .setTimestamp();

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [successEmbed] });
        } else {
            await interaction.reply({ 
                embeds: [successEmbed], 
                flags: [MessageFlags.Ephemeral] 
            });
        }

    } catch (error) {
        console.error('Database error in handleModalSubmit:', error);
        
        const errorMsg = { content: 'An error occurred while saving your report.', flags: [MessageFlags.Ephemeral] };
        
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMsg);
        } else {
            await interaction.reply(errorMsg);
        }
    }
}