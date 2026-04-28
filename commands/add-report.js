import { SlashCommandBuilder } from 'discord.js';
import * as reportHandler from '../interactions/reportHandler.js';

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    await reportHandler.showReportInterface(interaction);
}