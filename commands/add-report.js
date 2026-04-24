import { SlashCommandBuilder } from 'discord.js';
import Project from '../models/Project.js'; 
import Role from '../models/Role.js';

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    try {
        const [projects, roles] = await Promise.all([
            Project.find(),
            Role.find()
        ]);

        if (projects.length === 0) {
            return interaction.reply({
                content: 'No projects exist in the database. Use `/add-project` first.',
                ephemeral: true
            });
        }

        // V2 Payload Construction
        const payload = {
            flags: 32768, // IS_COMPONENTS_V2 flag
            components: [
                {
                    type: 17, // CONTAINER
                    accent_color: 0x3498DB, // The "Embed" color
                    components: [
                        {
                            type: 10, // TEXT_DISPLAY (Title)
                            content: "## Submit Daily Scrum Report\nSelect **Project** and **Role** below to start:"
                        },
                        {
                            type: 1, // ACTION_ROW for Project Select
                            components: [
                                {
                                    type: 3, // STRING_SELECT
                                    custom_id: 'project_select',
                                    placeholder: 'Select a project',
                                    options: projects.map(proj => ({ 
                                        label: proj.name, 
                                        value: proj.name 
                                    }))
                                }
                            ]
                        },
                        {
                            type: 1, // ACTION_ROW for Role Select
                            components: [
                                {
                                    type: 3, // STRING_SELECT
                                    custom_id: 'role_select',
                                    placeholder: 'Select your role',
                                    options: roles.map(role => ({ 
                                        label: role.name, 
                                        value: role.name 
                                    }))
                                }
                            ]
                        },
                        {
                            type: 1, // ACTION_ROW for Button
                            components: [
                                {
                                    type: 2, // BUTTON
                                    custom_id: 'open_report_modal',
                                    label: 'Write Report',
                                    style: 3, // Success (Green)
                                    disabled: true
                                }
                            ]
                        }
                    ]
                }
            ],
            ephemeral: true
        };

        await interaction.reply(payload);

    } catch (error) {
        console.error('Database error in add-report:', error);
        await interaction.reply({
            content: 'Failed to retrieve data from the database.',
            ephemeral: true
        });
    }
}