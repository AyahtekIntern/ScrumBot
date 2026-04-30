import { PermissionFlagsBits, MessageFlags } from 'discord.js';
import Report from '../models/Report.js';

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
                    required: true
                }]
            }
        ]
    });
}

export async function handleModalSubmit(interaction) {
    const fromStr = interaction.fields.getTextInputValue('from_date').trim();
    const toStr = interaction.fields.getTextInputValue('to_date').trim();

    const fromDate = parseLocalDateInput(fromStr);
    const toDate = parseLocalDateInput(toStr);

    if (!fromDate || !toDate) {
        return interaction.reply({
            content: '❌ Invalid date format. Use YYYY-MM-DD.',
            flags: [MessageFlags.Ephemeral]
        });
    }


    const payload = {
        flags: 32768,
        components: [{
            type: ComponentType.Container,
            accent_color: 0xE74C3C,
            components: [
                { 
                    type: ComponentType.TextDisplay, 
                    content: "# ⚠️ Confirm Mass Deletion" 
                },
                { 
                    type: ComponentType.TextDisplay, 
                    content: `You are about to delete all reports from **${fromStr}** to **${toStr}**.\n\n*This action is permanent and cannot be undone.*` 
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { 
                            type: ComponentType.Button, 
                            style: 4,
                            label: "Confirm Permanent Delete", 
                            custom_id: `scrum_confirm_delete_${fromStr}_${toStr}` 
                        }
                    ]
                }
            ]
        }]
    };

    await interaction.reply({ ...payload, ephemeral: true });
}

export async function handleConfirmDelete(interaction) {
    const hasRole = interaction.member.roles.cache.has(AUTHORIZED_ROLE_ID);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!hasRole && !isAdmin) {
        return interaction.update({
            content: "❌ Security Check Failed: You do not have the required role to execute this deletion.",
            components: [],
            flags: [MessageFlags.Ephemeral]
        });
    }

    const parts = interaction.customId.split('_');
    const toStr = parts[parts.length - 1];
    const fromStr = parts[parts.length - 2];

    const fromDate = parseLocalDateInput(fromStr);
    const toDate = parseLocalDateInput(toStr);

    try {
        const result = await Report.deleteMany({
            date: { $gte: fromDate, $lte: toDate }
        });

        await interaction.update({
            flags: 32768, 
            components: [{
                type: ComponentType.Container,
                accent_color: 0x2ECC71,
                components: [
                    { 
                        type: ComponentType.TextDisplay, 
                        content: "# ✅ Deletion Successful" 
                    },
                    { 
                        type: ComponentType.TextDisplay, 
                        content: `Successfully removed **${result.deletedCount}** reports for the range: \`${fromStr}\` to \`${toStr}\`.` 
                    }
                ]
            }]
        });

    } catch (error) {
        console.error('Mass delete error:', error);
        
        const errorContent = { content: 'An error occurred during deletion.', flags: [MessageFlags.Ephemeral] };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorContent);
        } else {
            await interaction.reply(errorContent);
        }
    }
}