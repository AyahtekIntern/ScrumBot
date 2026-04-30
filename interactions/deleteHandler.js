import { PermissionFlagsBits, MessageFlags } from 'discord.js';
import Report from '../models/Report.js';
import Project from '../models/Project.js';

const AUTHORIZED_ROLE_ID = '1498954138619220109';

const ComponentType = {
    ActionRow: 1,
    Button: 2,
    StringSelect: 3,
    TextDisplay: 10,
    Container: 17
};

function getTodayInputValue(){
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseLocalDateInput(dateInput) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return null;
    const [year, month, day] = dateInput.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return (parsed.getFullYear() === year && parsed.getMonth() === month - 1) ? parsed : null;
}

export async function showProjectSelection(interaction) {
    const projects = await Project.find().sort({ name: 1 });

    if (projects.length === 0) {
        return interaction.reply({ content: "No projects found.", flags: [MessageFlags.Ephemeral] });
    }

    const payload = {
        flags: 32768,
        components: [{
            type: ComponentType.Container,
            accent_color: 0x5865F2,
            components: [
                { type: ComponentType.TextDisplay, content: "## 🗑️ Delete Reports\nSelect the project you want to clear reports from:" },
                {
                    type: ComponentType.ActionRow,
                    components: [{
                        type: ComponentType.StringSelect,
                        custom_id: 'delete_reports_project_select',
                        placeholder: 'Choose a project...',
                        options: projects.map(p => ({ label: p.name, value: p.name }))
                    }]
                }
            ]
        }]
    };

    await interaction.reply({ ...payload, ephemeral: true });
}

export async function handleProjectSelect(interaction) {
    const projectName = interaction.values[0];

    await interaction.showModal({
        title: `Delete: ${projectName}`,
        custom_id: `delete_modal_${projectName}`, 
        components: [
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'from_date',
                    label: 'From Date (YYYY-MM-DD)',
                    style: 1,
                    placeholder: '2026-04-01',
                    required: true
                }]
            },
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'to_date',
                    label: 'To Date (YYYY-MM-DD)',
                    style: 1,
                    placeholder: getTodayInputValue(),
                    value: getTodayInputValue(),
                    required: true
                }]
            }
        ]
    });
}

export async function showDeleteModal(interaction) {

    const hasRole = interaction.member.roles.cache.has(AUTHORIZED_ROLE_ID);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!hasRole && !isAdmin) {
        return interaction.reply({
            content: `❌ You need the <@&${AUTHORIZED_ROLE_ID}> role to perform deletions.`,
            flags: [MessageFlags.Ephemeral]
        });
    }

    await interaction.showModal({
        title: 'Mass Delete Reports',
        custom_id: 'delete_reports_modal',
        components: [
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'from_date',
                    label: 'From Date (YYYY-MM-DD)',
                    style: 1,
                    placeholder: '2026-04-01',
                    required: true
                }]
            },
            {
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'to_date',
                    label: 'To Date (YYYY-MM-DD)',
                    style: 1,
                    placeholder: getTodayInputValue(),
                    value: getTodayInputValue(),
                    required: true
                }]
            }
        ]
    });
}

export async function handleModalSubmit(interaction) {
    const projectName = interaction.customId.split('_')[2]; // Get project from ID
    const fromStr = interaction.fields.getTextInputValue('from_date').trim();
    const toStr = interaction.fields.getTextInputValue('to_date').trim();

    const fromDate = parseLocalDateInput(fromStr);
    const toDate = parseLocalDateInput(toStr);

    if (!fromDate || !toDate) {
        return interaction.reply({
            content: '❌ Please use the YYYY-MM-DD format for both dates.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (fromDate > toDate) {
        return interaction.reply({
            content: '❌ The "From" date must be on or before the "To" date.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const payload = {
        flags: 32768,
        components: [{
            type: ComponentType.Container,
            accent_color: 0xE74C3C,
            components: [
                { type: ComponentType.TextDisplay, content: "# ⚠️ Final Confirmation" },
                { type: ComponentType.TextDisplay, content: `Project: **${projectName}**\nRange: **${fromStr}** to **${toStr}**\n\n*Are you sure?*` },
                {
                    type: ComponentType.ActionRow,
                    components: [{
                        type: ComponentType.Button,
                        style: 4,
                        label: "Confirm Delete",
                        custom_id: `confirm_del_${projectName}_${fromStr}_${toStr}`
                    }]
                }
            ]
        }]
    };

    await interaction.reply({ ...payload, ephemeral: true });
}

export async function handleConfirmDelete(interaction) {
    const [, , projectName, fromStr, toStr] = interaction.customId.split('_');

    const fromDate = parseLocalDateInput(fromStr);
    const toDate = parseLocalDateInput(toStr);

    if (!fromDate || !toDate) {
        return interaction.reply({
            content: '❌ Invalid date range. Please try again with YYYY-MM-DD.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (fromDate > toDate) {
        return interaction.reply({
            content: '❌ The "From" date must be on or before the "To" date.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const result = await Report.deleteMany({
        projectName: projectName,
        date: {
            $gte: fromDate,
            $lte: toDate
        }
    });

    await interaction.update({
        flags: 32768,
        components: [{
            type: ComponentType.Container,
            accent_color: 0x2ECC71,
            components: [
                { type: ComponentType.TextDisplay, content: "# ✅ Done" },
                { type: ComponentType.TextDisplay, content: `Deleted **${result.deletedCount}** reports for **${projectName}**.` }
            ]
        }]
    });
}