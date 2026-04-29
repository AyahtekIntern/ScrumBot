import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import Project from '../models/Project.js';
import Role from '../models/Role.js';
import Report from '../models/Report.js';

const REPORT_BLOCKED_MESSAGE = 'Report submissions are closed from 11:00 PM to 8:00 AM. Please try again later.';

export function isReportSubmissionBlocked() {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 8;
}

export async function showReportInterface(interaction) {
    try {
        const [projects, roles] = await Promise.all([
            Project.find(),
            Role.find()
        ]);

        if (projects.length === 0) {
            return interaction.reply({
                content: 'No projects exist in the database. Use `/scrum` and add a project first.',
                ephemeral: true
            });
        }

        const payload = {
            flags: 32768,
            components: [
                {
                    type: 17,
                    accent_color: 0x3498DB,
                    components: [
                        {
                            type: 10,
                            content: "## Submit Daily Scrum Report\nSelect **Project** and **Role** below to start:"
                        },
                        {
                            type: 1,
                            components: [{
                                type: 3,
                                custom_id: 'project_select',
                                placeholder: 'Select a project',
                                options: projects.map(proj => ({ label: proj.name, value: proj.name }))
                            }]
                        },
                        {
                            type: 1,
                            components: [{
                                type: 3,
                                custom_id: 'role_select',
                                placeholder: 'Select your role',
                                options: roles.map(role => ({ label: role.name, value: role.name }))
                            }]
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    custom_id: 'open_report_modal',
                                    label: 'Write New',
                                    style: 3, 
                                    disabled: true
                                },
                                {
                                    type: 2,
                                    custom_id: 'update_report_modal', 
                                    label: 'Update Existing',
                                    style: 1, 
                                    disabled: true
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        await interaction.reply(payload);

    } catch (error) {
        console.error('Error in showReportInterface:', error);
        await interaction.reply({
            content: 'Failed to retrieve data from the database.',
            flags: [MessageFlags.Ephemeral]
        });
    }
}

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
        const project = projPlaceholder.split(': ')[1];
        const role = rolePlaceholder.split(': ')[1];
        const today = parseLocalDateInput(getTodayInputValue());

        const existingReport = await Report.findOne({
            username: interaction.user.username,
            projectName: project,
            role: role,
            date: today
        });

        const hasReport = !!existingReport;

        const writeBtn = ButtonBuilder.from(newRows[2].components[0])
            .setDisabled(hasReport)
            .setLabel(hasReport ? 'Report Already Submitted' : 'Write New');

        const updateBtn = ButtonBuilder.from(newRows[2].components[1])
            .setDisabled(!hasReport)
            .setLabel(hasReport ? 'Update Existing' : 'No Report to Update');
        
        newRows[2].setComponents(writeBtn, updateBtn);
    
    }

    await interaction.update({ 
        components: [{ type: 17, components: newRows }] 
    });
}


export async function handleOpenModal(interaction) {
    if (isReportSubmissionBlocked()) {
        return interaction.reply({
            content: REPORT_BLOCKED_MESSAGE,
            flags: [MessageFlags.Ephemeral]
        });
    }

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

    const today = parseLocalDateInput(getTodayInputValue());
    const existingReport = await Report.findOne({
        username: interaction.user.username,
        projectName: project,
        role: role,
        date: today
    });

    const modal = new ModalBuilder()
        .setCustomId(`report_modal_${project}_${role}`)
        .setTitle(existingReport ? `Edit: ${project}` : `New Report: ${project}`);

    const updateInput = new TextInputBuilder()
        .setCustomId('update_input')
        .setLabel('Updates')
        .setPlaceholder('Feature A completed\nFixed bug #123\n(Press Enter for new lines)')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(existingReport ? existingReport.updates : '');
        
    const planInput = new TextInputBuilder()
        .setCustomId('plan_input')
        .setLabel('Plans')
        .setPlaceholder('Continue dev\nContinue testing #123\n(Press Enter for new lines)')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(existingReport ? existingReport.plans : '');
        
    const impedimentsInput = new TextInputBuilder()
        .setCustomId('impediments_input') 
        .setLabel('Impediments')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(existingReport ? existingReport.impediments : '')
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
    if (isReportSubmissionBlocked()) {
        return interaction.reply({
            content: REPORT_BLOCKED_MESSAGE,
            flags: [MessageFlags.Ephemeral]
        });
    }

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
        const existingReport = await Report.findOne({
            username: interaction.user.username,
            projectName: projectName,
            role: role,
            date: reportDate
        });

        await Report.findOneAndUpdate(
            {
                username: interaction.user.username,
                projectName: projectName,
                role: role,
                date: reportDate
            },
            {
            displayName: interaction.member.displayName,
            role: role,
            updates: updates,
            plans: plans,
            impediments: impediments,
            },
            { upsert: true, returnDocument: 'after' }
        );

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

        const LOG_CHANNEL_ID = '1498537343265669150'; 
        const logChannel = interaction.client.channels.cache.get(LOG_CHANNEL_ID);

        if (logChannel) {
            const action = existingReport ? 'updated their' : 'submitted a new';
            
            const userLink = `${interaction.member.displayName}`;

            await logChannel.send({
                content: `📝 **${userLink}** has ${action} report in **${projectName}**`,
                allowedMentions: { parse: [] } 
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