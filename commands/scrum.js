import { SlashCommandBuilder } from 'discord.js';
import * as scrumHandler from '../interactions/scrumHandler.js';

export const data = new SlashCommandBuilder()
    .setName('scrum')
    .setDescription('Manage Scrum Projects and Roles');

export async function execute(interaction) {
    await scrumHandler.showDashboard(interaction);
}