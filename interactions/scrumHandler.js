import { MessageFlags } from 'discord.js';
import Project from '../models/Project.js'; 
import Role from '../models/Role.js';
import Report from '../models/Report.js';

const ComponentType = {
    ActionRow: 1,
    Button: 2,
    StringSelect: 3,
    TextDisplay: 10,
    Separator: 14,
    Container: 17
};

const EDIT_PROJECT_SELECT_ID = 'scrum_edit_project_select';
const EDIT_ROLE_SELECT_ID = 'scrum_edit_role_select';
const DELETE_PROJECT_SELECT_ID = 'scrum_delete_project_select';
const DELETE_ROLE_SELECT_ID = 'scrum_delete_role_select';
const EDIT_PROJECT_MODAL_PREFIX = 'modal_edit_project_';
const EDIT_ROLE_MODAL_PREFIX = 'modal_edit_role_';
const OPEN_EDIT_PROJECT_MODAL_PREFIX = 'scrum_open_edit_project_modal_';
const OPEN_EDIT_ROLE_MODAL_PREFIX = 'scrum_open_edit_role_modal_';

function encodeValue(value) {
    return encodeURIComponent(value);
}

function decodeValue(value) {
    return decodeURIComponent(value);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDashboardPayload(projects, roles) {
    const projectList = projects.length > 0 ? projects.map(p => `• ${p.name}`).join('\n') : '*No projects.*';
    const roleList = roles.length > 0 ? roles.map(r => `• ${r.name}`).join('\n') : '*No roles.*';

    return {
        flags: 32768, // IS_COMPONENTS_V2
        components: [{
            type: ComponentType.Container,
            accent_color: 0x5865F2,
            components: [
                { type: ComponentType.TextDisplay, content: "# Project and Role List" },
                { type: ComponentType.TextDisplay, content: `### 📁 Projects\n${projectList}\n\n### 👤 Roles\n${roleList}` },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { type: ComponentType.Button, style: 3, label: "Add Project", custom_id: "scrum_add_project_btn" },
                        { type: ComponentType.Button, style: 3, label: "Add Role", custom_id: "scrum_add_role_btn" }
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { type: ComponentType.Button, style: 1, label: "Edit Project", custom_id: "scrum_edit_project_btn" },
                        { type: ComponentType.Button, style: 1, label: "Edit Role", custom_id: "scrum_edit_role_btn" }
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { type: ComponentType.Button, style: 4, label: "Delete Project", custom_id: "scrum_delete_project_btn" },
                        { type: ComponentType.Button, style: 4, label: "Delete Role", custom_id: "scrum_delete_role_btn" }
                    ]
                }
            ]
        }]
    };
}

function buildEditPayload(kind, items, selectedValue) {
    const isProject = kind === 'project';
    const label = isProject ? 'Project' : 'Role';
    const selectId = isProject ? EDIT_PROJECT_SELECT_ID : EDIT_ROLE_SELECT_ID;
    const buttonPrefix = isProject ? OPEN_EDIT_PROJECT_MODAL_PREFIX : OPEN_EDIT_ROLE_MODAL_PREFIX;
    const buttonCustomId = selectedValue ? `${buttonPrefix}${encodeValue(selectedValue)}` : `${buttonPrefix}pending`;

    return {
        flags: 32768,
        components: [
            {
                type: ComponentType.Container,
                accent_color: 0xF1C40F,
                components: [
                    { type: ComponentType.TextDisplay, content: `## Edit ${label}\nSelect a ${label.toLowerCase()} and enter the new name.` },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.StringSelect,
                                custom_id: selectId,
                                placeholder: selectedValue ? `Selected: ${selectedValue}` : `Select a ${label.toLowerCase()}`,
                                options: items.map(item => ({ label: item.name, value: item.name }))
                            }
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: 3,
                                label: `Rename ${label}`,
                                custom_id: buttonCustomId,
                                disabled: !selectedValue
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

function buildDeletePayload(kind, items) {
    const isProject = kind === 'project';
    const label = isProject ? 'Project' : 'Role';
    const selectId = isProject ? DELETE_PROJECT_SELECT_ID : DELETE_ROLE_SELECT_ID;

    return {
        flags: 32768,
        components: [
            {
                type: ComponentType.Container,
                accent_color: 0xE74C3C,
                components: [
                    { type: ComponentType.TextDisplay, content: `## Delete ${label}\nSelect a ${label.toLowerCase()} to delete it immediately.` },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.StringSelect,
                                custom_id: selectId,
                                placeholder: `Select a ${label.toLowerCase()}`,
                                options: items.map(item => ({ label: item.name, value: item.name }))
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

export async function showDashboard(interaction) {
    const [projects, roles] = await Promise.all([Project.find(), Role.find()]);

    const payload = buildDashboardPayload(projects, roles);

    if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
        return await interaction.update(payload);
    }
    await interaction.reply({ ...payload, ephemeral: false });
}

export async function handleButtons(interaction) {
    if (interaction.customId === 'scrum_add_project_btn') {
        await interaction.showModal({
            title: 'Add New Project',
            custom_id: 'modal_add_project',
            components: [{
                type: ComponentType.ActionRow,
                components: [{ type: 4, custom_id: 'name_input', label: 'Project Name', style: 1, required: true }]
            }]
        });
    }

    if (interaction.customId === 'scrum_add_role_btn') {
        await interaction.showModal({
            title: 'Add New Role',
            custom_id: 'modal_add_role',
            components: [{
                type: ComponentType.ActionRow,
                components: [{ type: 4, custom_id: 'name_input', label: 'Role Name', style: 1, required: true }]
            }]
        });
    }

    if (interaction.customId === 'scrum_edit_project_btn') {
        const projects = await Project.find().sort({ name: 1 });
        if (projects.length === 0) {
            return interaction.reply({
                content: 'No projects available to edit.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        return interaction.update(buildEditPayload('project', projects));
    }

    if (interaction.customId === 'scrum_edit_role_btn') {
        const roles = await Role.find().sort({ name: 1 });
        if (roles.length === 0) {
            return interaction.reply({
                content: 'No roles available to edit.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        return interaction.update(buildEditPayload('role', roles));
    }

    if (interaction.customId === 'scrum_delete_project_btn') {
        const projects = await Project.find().sort({ name: 1 });
        if (projects.length === 0) {
            return interaction.reply({
                content: 'No projects available to delete.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        return interaction.update(buildDeletePayload('project', projects));
    }

    if (interaction.customId === 'scrum_delete_role_btn') {
        const roles = await Role.find().sort({ name: 1 });
        if (roles.length === 0) {
            return interaction.reply({
                content: 'No roles available to delete.',
                flags: [MessageFlags.Ephemeral]
            });
        }
        return interaction.update(buildDeletePayload('role', roles));
    }

    if (interaction.customId.startsWith(OPEN_EDIT_PROJECT_MODAL_PREFIX)) {
        const encodedName = interaction.customId.slice(OPEN_EDIT_PROJECT_MODAL_PREFIX.length);
        if (encodedName === 'pending') {
            return interaction.reply({
                content: 'Select a project before renaming.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const projectName = decodeValue(encodedName);
        return interaction.showModal({
            title: 'Edit Project',
            custom_id: `${EDIT_PROJECT_MODAL_PREFIX}${encodedName}`,
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'new_name_input',
                    label: 'New Project Name',
                    style: 1,
                    required: true,
                    value: projectName
                }]
            }]
        });
    }

    if (interaction.customId.startsWith(OPEN_EDIT_ROLE_MODAL_PREFIX)) {
        const encodedName = interaction.customId.slice(OPEN_EDIT_ROLE_MODAL_PREFIX.length);
        if (encodedName === 'pending') {
            return interaction.reply({
                content: 'Select a role before renaming.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const roleName = decodeValue(encodedName);
        return interaction.showModal({
            title: 'Edit Role',
            custom_id: `${EDIT_ROLE_MODAL_PREFIX}${encodedName}`,
            components: [{
                type: ComponentType.ActionRow,
                components: [{
                    type: 4,
                    custom_id: 'new_name_input',
                    label: 'New Role Name',
                    style: 1,
                    required: true,
                    value: roleName
                }]
            }]
        });
    }
}

export async function handleModalSubmit(interaction) {
    if (interaction.customId.startsWith('modal_add_')) {
        const isProject = interaction.customId === 'modal_add_project';
        const inputName = interaction.fields.getTextInputValue('name_input').trim();
        const Model = isProject ? Project : Role;

        const exists = await Model.findOne({ 
            name: { $regex: new RegExp(`^${escapeRegex(inputName)}$`, 'i') } 
        });

        if (exists) {
            return interaction.reply({ 
                content: `❌ The ${isProject ? 'Project' : 'Role'} "${inputName}" already exists!`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        await Model.create({ name: inputName });
        
        // Auto-refresh the main dashboard card to show the new entry
        return await showDashboard(interaction);
    }

    if (interaction.customId.startsWith(EDIT_PROJECT_MODAL_PREFIX)) {
        const encodedName = interaction.customId.slice(EDIT_PROJECT_MODAL_PREFIX.length);
        const currentName = decodeValue(encodedName);
        const newName = interaction.fields.getTextInputValue('new_name_input').trim();

        if (!newName) {
            return interaction.reply({
                content: 'Project name cannot be empty.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (newName.toLowerCase() === currentName.toLowerCase()) {
            return interaction.reply({
                content: 'No changes detected. Provide a new project name.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const exists = await Project.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(newName)}$`, 'i') }
        });

        if (exists) {
            return interaction.reply({
                content: `❌ The Project "${newName}" already exists!`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        await Project.updateOne({ name: currentName }, { $set: { name: newName } });
        await Report.updateMany({ projectName: currentName }, { $set: { projectName: newName } });

        return await showDashboard(interaction);
    }

    if (interaction.customId.startsWith(EDIT_ROLE_MODAL_PREFIX)) {
        const encodedName = interaction.customId.slice(EDIT_ROLE_MODAL_PREFIX.length);
        const currentName = decodeValue(encodedName);
        const newName = interaction.fields.getTextInputValue('new_name_input').trim();

        if (!newName) {
            return interaction.reply({
                content: 'Role name cannot be empty.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (newName.toLowerCase() === currentName.toLowerCase()) {
            return interaction.reply({
                content: 'No changes detected. Provide a new role name.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const exists = await Role.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(newName)}$`, 'i') }
        });

        if (exists) {
            return interaction.reply({
                content: `❌ The Role "${newName}" already exists!`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        await Role.updateOne({ name: currentName }, { $set: { name: newName } });
        await Report.updateMany({ role: currentName }, { $set: { role: newName } });

        return await showDashboard(interaction);
    }
}

export async function handleSelection(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const selectedValue = interaction.values[0];

    if (interaction.customId === EDIT_PROJECT_SELECT_ID) {
        const projects = await Project.find().sort({ name: 1 });
        return interaction.update(buildEditPayload('project', projects, selectedValue));
    }

    if (interaction.customId === EDIT_ROLE_SELECT_ID) {
        const roles = await Role.find().sort({ name: 1 });
        return interaction.update(buildEditPayload('role', roles, selectedValue));
    }

    if (interaction.customId === DELETE_PROJECT_SELECT_ID) {
        await Project.deleteOne({ name: selectedValue });
        return await showDashboard(interaction);
    }

    if (interaction.customId === DELETE_ROLE_SELECT_ID) {
        await Role.deleteOne({ name: selectedValue });
        return await showDashboard(interaction);
    }
}

