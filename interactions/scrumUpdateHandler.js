import Project from '../models/Project.js';
import Report from '../models/Report.js';

function getTodayRange() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

function encodeProject(projectName) {
    return encodeURIComponent(projectName);
}

function decodeProject(encodedProjectName) {
    return decodeURIComponent(encodedProjectName);
}

function formatRoleGroupedUpdates(reports) {
    if (reports.length === 0) {
        return 'No updates submitted today for this project.';
    }

    const groupedByRole = reports.reduce((acc, report) => {
        const role = report.role || 'Unassigned';
        if (!acc[role]) acc[role] = [];
        acc[role].push(`- **${report.username}**: ${report.updates}`);
        return acc;
    }, {});

    const sortedRoles = Object.keys(groupedByRole).sort((a, b) => a.localeCompare(b));

    return sortedRoles
        .map((role) => `### ${role}\n${groupedByRole[role].join('\n')}`)
        .join('\n\n');
}

function formatPlainList(reports, key, emptyMessage) {
    if (reports.length === 0) {
        return emptyMessage;
    }
    return reports
        .map((report) => `- **${report.username}** (${report.role || 'Unassigned'}): ${report[key]}`)
        .join('\n');
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

function buildPayload(projects, selectedProject, activeTab, panelBody) {
    const encodedProject = encodeProject(selectedProject);

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
                                placeholder: 'Choose a project...',
                                options: projects.map((project) => ({
                                    label: project.name,
                                    value: project.name,
                                    default: project.name === selectedProject
                                }))
                            }
                        ]
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                custom_id: `scrum_update_view_updates_${encodedProject}`,
                                label: 'Updates',
                                style: activeTab === 'updates' ? 3 : 2
                            },
                            {
                                type: 2,
                                custom_id: `scrum_update_view_plans_${encodedProject}`,
                                label: 'Plans',
                                style: activeTab === 'plans' ? 3 : 2
                            },
                            {
                                type: 2,
                                custom_id: `scrum_update_view_impediments_${encodedProject}`,
                                label: 'Impediments',
                                style: activeTab === 'impediments' ? 4 : 2
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

async function getTodayReportsForProject(projectName) {
    const { startOfDay, endOfDay } = getTodayRange();
    return Report.find({
        projectName,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ role: 1, date: 1 });
}

async function createViewPayload(selectedProject, activeTab) {
    const projects = await getProjects();

    if (projects.length === 0) {
        return {
            content: 'No projects exist in the database. Use `/add-project` first.',
            ephemeral: false
        };
    }

    const resolvedProject = selectedProject || projects[0].name;
    const reports = await getTodayReportsForProject(resolvedProject);
    const panelBody = getPanelBody(activeTab, reports);

    return buildPayload(projects, resolvedProject, activeTab, panelBody);
}

export async function sendInitialScrumUpdate(interaction) {
    try {
        const payload = await createViewPayload(undefined, 'updates');
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
        const payload = await createViewPayload(selectedProject, 'updates');
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
        const parts = interaction.customId.split('_');
        const activeTab = parts[3];
        const encodedProject = parts.slice(4).join('_');
        const selectedProject = decodeProject(encodedProject);

        const payload = await createViewPayload(selectedProject, activeTab);
        await interaction.update(payload);
    } catch (error) {
        console.error('Database error in scrum-update view toggle:', error);
        await interaction.update({
            content: 'Failed to refresh selected view.',
            components: []
        });
    }
}
