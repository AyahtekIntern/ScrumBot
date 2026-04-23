import { EmbedBuilder } from 'discord.js';
import { reports } from '../data.js';

export async function execute(message) {
    if (message.author.bot || !message.content.startsWith('!scrum-update')) return;

    try {
        const members = await message.guild.members.fetch();
        const humanMembers = members.filter(member => !member.user.bot);

        if (humanMembers.size === 0) {
            return await message.channel.send("No human members found in this server.");
        }

        const scrumFields = humanMembers.map(member => {
            const hasUpdated = reports.some(r => String(r.userId) === String(member.id));
            
            return {
                name: member.displayName || "Unknown User",
                value: hasUpdated ? 'Submitted' : 'No Updates',
                inline: true 
            };
        });

        const scrumEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('Daily Scrum Status')
            .setDescription(`Checking status for ${humanMembers.size} members:`) 
            .addFields(scrumFields)
            .setTimestamp();

        await message.channel.send({ embeds: [scrumEmbed] });

    } catch (error) {
        console.error("Crash caught:", error);
        await message.channel.send("Error: Check bot console. Likely an empty data field.");
    }
}