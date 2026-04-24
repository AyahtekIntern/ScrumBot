import { SlashCommandBuilder } from 'discord.js';
import * as scrumUpdateHandler from '../interactions/scrumUpdateHandler.js';

export const data = new SlashCommandBuilder()
    .setName('scrum-update')
    .setDescription('View today\'s updates, plans, and impediments for a selected project');

export async function execute(interaction) {
    await scrumUpdateHandler.sendInitialScrumUpdate(interaction);
}
