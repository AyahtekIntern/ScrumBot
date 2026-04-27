import { MessageFlags } from 'discord.js';
import Project from '../models/Project.js'; 
import Role from '../models/Role.js';

const ComponentType = {
    ActionRow: 1,
    Button: 2,
    StringSelect: 3,
    TextDisplay: 10,
    Separator: 14,
    Container: 17
};

export async function showDashboard(interaction) {
    const [projects, roles] = await Promise.all([Project.find(), Role.find()]);

    const projectList = projects.length > 0 ? projects.map(p => `• ${p.name}`).join('\n') : '*No projects.*';
    const roleList = roles.length > 0 ? roles.map(r => `• ${r.name}`).join('\n') : '*No roles.*';

    const payload = {
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
                }
            ]
        }]
    };

    if (interaction.isButton() || interaction.isModalSubmit()) {
        return await interaction.update(payload);
    }
    await interaction.reply({ ...payload, ephemeral: true });
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

    if (interaction.customId === 'scrum_open_delete') {
        await renderDeleteCard(interaction);
    }
}

export async function handleModalSubmit(interaction) {
    const isProject = interaction.customId === 'modal_add_project';
    const inputName = interaction.fields.getTextInputValue('name_input').trim();
    const Model = isProject ? Project : Role;

    const exists = await Model.findOne({ 
        name: { $regex: new RegExp(`^${inputName}$`, 'i') } 
    });

    if (exists) {
        return interaction.reply({ 
            content: `❌ The ${isProject ? 'Project' : 'Role'} "${inputName}" already exists!`, 
            flags: [MessageFlags.Ephemeral] 
        });
    }

    await Model.create({ name: inputName });
    
    // Auto-refresh the main dashboard card to show the new entry
    await showDashboard(interaction);
}

