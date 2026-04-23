import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Report from '../models/Report.js'; import { reports } from '../data.js';

export async function execute(message) {
    if (message.author.bot) return;

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysReports = await Report.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        const members = await message.guild.members.fetch();
        const humanMembers = members.filter(member => !member.user.bot);

            if (humanMembers.size === 0) {
                return await message.channel.send("No human members found.");
            }

        const scrumFields = humanMembers.map(member => {
            // Background match using the system username stored in the database
            const hasUpdated = todaysReports.some(r => r.username === member.user.username);
            
            return {
                name: member.displayName, 
                value: hasUpdated ? 'Submitted' : 'No Updates'
            };
        });

        const scrumEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('Daily Scrum Status')
            .setDescription(`Checking status for ${humanMembers.size} members for today:`) 
            .addFields(scrumFields)
            .setTimestamp();

        await message.channel.send({ embeds: [scrumEmbed] });

    } catch (error) {
        console.error("Database or execution error in scrum-update:", error);
        await message.channel.send("Error processing the scrum update. Check the bot console.");
    }
}