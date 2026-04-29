import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import * as reportHandler from '../interactions/reportHandler.js';

export const data = new SlashCommandBuilder()
    .setName('add-report')
    .setDescription('Submit your daily scrum report');

export async function execute(interaction) {
    if (reportHandler.isReportSubmissionBlocked()) {
        return interaction.reply({
            content: 'Report submissions are closed from 11:00 PM to 8:00 AM. Please try again later.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    await reportHandler.showReportInterface(interaction);
}