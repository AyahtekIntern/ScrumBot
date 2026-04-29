import { MessageFlags } from 'discord.js';
import Project from '../models/Project.js';
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

    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

function getRangeForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

function encodeProject(projectName) {
    return encodeURIComponent(projectName);
}

function decodeProject(encodedProjectName) {
    return decodeURIComponent(encodedProjectName);
}

function encodeDate(dateValue) {
    return encodeURIComponent(dateValue);
}

function decodeDate(encodedDate) {
    return decodeURIComponent(encodedDate);
}

function formatRoleGroupedUpdates(reports) {
    if (reports.length === 0) {
        return 'No updates submitted today for this project.';
    }

    const groupedByRole = reports.reduce((acc, report) => {
        const role = report.role || 'Unassigned';
        if (!acc[role]) acc[role] = [];

        const subList = report.updates
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const cleanLine = line.replace(/^[-*•]\s*/, '');
                return `  ┕ ${cleanLine}`;
            })
            .join('\n');

        acc[role].push(`* **${report.displayName}**:\n${subList}`);
        
        return acc;
    }, {});

    const sortedRoles = Object.keys(groupedByRole).sort((a, b) => a.localeCompare(b));

    return sortedRoles
        .map((role) => `## ${role}\n${groupedByRole[role].join('\n')}`)
        .join('\n\n');
}

function formatPlainList(reports, key, emptyMessage) {
    if (reports.length === 0) {
        return emptyMessage;
    }

    return reports
        .map((report) => {
            const rawValue = report[key] || '';

            const subList = rawValue
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    const cleanLine = line.replace(/^[-*•]\s*/, '');
                    return `  ┕ ${cleanLine}`;
                })
                .join('\n');

            return `* **${report.displayName}** (${report.role || 'Dev'}):\n${subList}`;
        })
        .join('\n\n');
}

function getPanelBody(tab, reports) {
    if (tab === 'updates') {
        return formatRoleGroupedUpdates(reports);
    }

    if (tab === 'plans') {
        return formatPlainList(reports, 'plans', 'No plans submitted today for this project.');
    }

    return formatPlainList(reports, 'impediments', 'No impediments submitted today for this project.');
}

function buildPayload(projects, selectedProject, activeTab, panelBody, selectedDate) {
    const hasSelection = Boolean(selectedProject);
    const encodedProject = hasSelection ? encodeProject(selectedProject) : '';
    const placeholder = hasSelection ? `Selected: ${selectedProject}` : '-- SELECT PROJECT --';
    const encodedDate = encodeDate(selectedDate);

    return {
        flags: 32768,
        components: [
            {
                type: 17,
                accent_color: 0x3498DB,
                components: [
                    {
                        type: 10,
                        content: '## Project Updates\nSelect a project and see the updates.'
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 3,
                                custom_id: 'scrum_update_project_select',
                                placeholder,
                                options: projects.map((project) => ({
                                    label: project.name,
                                    value: project.name,
                                    default: hasSelection && project.name === selectedProject
                                }))
                            }
                        ]
                    },
                    {
                        type: 10,
                        content: `### Date: ${selectedDate}`
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                custom_id: 'scrum_update_open_date_modal',
                                label: 'Change Date',
                                style: 2
                            }
                        ]
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                custom_id: `scrum_update_view_updates|${encodedProject}|${encodedDate}`,
                                label: 'Updates',
                                style: activeTab === 'updates' ? 3 : 2,
                                disabled: !hasSelection
                            },
                            {
                                type: 2,
                                custom_id: `scrum_update_view_plans|${encodedProject}|${encodedDate}`,
                                label: 'Plans',
                                style: activeTab === 'plans' ? 3 : 2,
                                disabled: !hasSelection
                            },
                            {
                                type: 2,
                                custom_id: `scrum_update_view_impediments|${encodedProject}|${encodedDate}`,
                                label: 'Impediments',
                                style: activeTab === 'impediments' ? 4 : 2,
                                disabled: !hasSelection
                            }
                        ]
                    },
                    {
                        type: 10,
                        content: `### View: ${activeTab[0].toUpperCase()}${activeTab.slice(1)}\n\n${panelBody}`
                    }
                ]
            }
        ],
        ephemeral: false
    };
}

async function getProjects() {
    return Project.find().sort({ name: 1 });
}

async function getReportsForProjectByDate(projectName, selectedDate) {
    const parsedDate = parseLocalDateInput(selectedDate) || new Date();
    const { startOfDay, endOfDay } = getRangeForDate(parsedDate);
    return Report.find({
        projectName,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ role: 1, date: 1 });
}

async function createViewPayload(selectedProject, activeTab, selectedDate) {
    const projects = await getProjects();
    const resolvedDate = selectedDate || getTodayInputValue();

    if (projects.length === 0) {
        return {
            content: 'No projects exist in the database. Use `/scrum` to add a project first.',
            ephemeral: false
        };
    }

    if (!selectedProject) {
        return buildPayload(
            projects,
            null,
            activeTab,
            'Select a project from the dropdown to load updates.',
            resolvedDate
        );
    }

    const reports = await getReportsForProjectByDate(selectedProject, resolvedDate);
    const panelBody = getPanelBody(activeTab, reports);

    return buildPayload(projects, selectedProject, activeTab, panelBody, resolvedDate);
}

function getSelectedProjectFromMessage(message) {
    const rawComponents = message?.components ?? message?.data?.components;
    if (!Array.isArray(rawComponents) || rawComponents.length === 0) return null;

    const container = rawComponents[0]?.type === 17 ? rawComponents[0].components : rawComponents;
    if (!Array.isArray(container)) return null;

    const selectRow = container.find(row => row.type === 1 && row.components?.[0]?.custom_id === 'scrum_update_project_select');
    const placeholder = selectRow?.components?.[0]?.placeholder;

    if (placeholder && placeholder.startsWith('Selected: ')) {
        return placeholder.replace('Selected: ', '').trim();
    }

    return null;
}

function getSelectedDateFromMessage(message) {
    const rawComponents = message?.components ?? message?.data?.components;
    if (!Array.isArray(rawComponents) || rawComponents.length === 0) return getTodayInputValue();

    const container = rawComponents[0]?.type === 17 ? rawComponents[0].components : rawComponents;
    if (!Array.isArray(container)) return getTodayInputValue();

    const dateDisplay = container.find(
        component => component.type === 10 && typeof component.content === 'string' && component.content.startsWith('### Date:')
    );

    if (!dateDisplay) return getTodayInputValue();

    return dateDisplay.content.replace('### Date:', '').trim() || getTodayInputValue();
}

export async function sendInitialScrumUpdate(interaction) {
    try {
        const payload = await createViewPayload(undefined, 'updates', getTodayInputValue());
        await interaction.reply(payload);
    } catch (error) {
        console.error('Database error in scrum-update:', error);
        await interaction.reply({
            content: 'Failed to load scrum updates from the database.',
            ephemeral: false
        });
    }
}

export async function handleProjectSelect(interaction) {
    try {
        const selectedProject = interaction.values[0];
        const selectedDate = getSelectedDateFromMessage(interaction.message);
        const payload = await createViewPayload(selectedProject, 'updates', selectedDate);
        await interaction.update(payload);
    } catch (error) {
        console.error('Database error in scrum-update project select:', error);
        await interaction.update({
            content: 'Failed to refresh project data.',
            components: []
        });
    }
}

export async function handleViewToggle(interaction) {
    try {
        const trimmed = interaction.customId.replace('scrum_update_view_', '');
        const [activeTab, encodedProject, encodedDate] = trimmed.split('|');
        const selectedProject = decodeProject(encodedProject || '');
        const selectedDate = decodeDate(encodedDate || '');

        if (!selectedProject) {
            const payload = await createViewPayload(undefined, 'updates', selectedDate || getTodayInputValue());
            return interaction.update(payload);
        }

        const payload = await createViewPayload(selectedProject, activeTab, selectedDate || getTodayInputValue());
        await interaction.update(payload);
    } catch (error) {
        console.error('Database error in scrum-update view toggle:', error);
        await interaction.update({
            content: 'Failed to refresh selected view.',
            components: []
        });
    }
}

export async function handleOpenDateModal(interaction) {
    const selectedProject = getSelectedProjectFromMessage(interaction.message);
    const selectedDate = getSelectedDateFromMessage(interaction.message);
    const encodedProject = selectedProject ? encodeProject(selectedProject) : 'none';

    await interaction.showModal({
        title: 'Select Report Date',
        custom_id: `scrum_update_date_modal_${encodedProject}`,
        components: [{
            type: 1,
            components: [{
                type: 4,
                custom_id: 'scrum_update_date_input',
                label: 'Report date (YYYY-MM-DD)',
                style: 1,
                required: true,
                value: selectedDate || getTodayInputValue()
            }]
        }]
    });
}

export async function handleDateModalSubmit(interaction) {
    const inputDate = interaction.fields.getTextInputValue('scrum_update_date_input').trim();
    const parsedDate = parseLocalDateInput(inputDate);

    if (!parsedDate) {
        return interaction.reply({
            content: 'Invalid date format. Please use YYYY-MM-DD.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const encodedProject = interaction.customId.replace('scrum_update_date_modal_', '');
    const selectedProject = encodedProject === 'none' ? null : decodeProject(encodedProject);
    const payload = await createViewPayload(selectedProject, 'updates', inputDate);

    await interaction.update(payload);
}
