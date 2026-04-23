import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { reports } from '../data.js';

export async function execute(message) {
    if (message.author.bot) return;

    if (message.content.startsWith('!scrum-update')) {
        try {
            const members = await message.guild.members.fetch();
            const humanMembers = members.filter(member => !member.user.bot);

            if (humanMembers.size === 0) {
                return await message.channel.send("No human members found.");
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
            console.error(error);
            await message.channel.send("Error generating scrum status.");
        }
    } 

    else if (message.content.startsWith('!scrum-help')) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('❓ Scrum Bot Help')
            .setDescription('Here are the available commands:')
            .addFields(
                { name: '!scrum-help', value: 'Display this help message.' },
                { name: '!scrum-update', value: 'Check the daily scrum status for all members.' },
                { name: '/add-project', value: 'Add a new project to the list.' },
                { name: '/add-report', value: 'Add a new report to the list.' }
            );

        await message.channel.send({ embeds: [helpEmbed] });
    }

    else if (message.content.startsWith('!scrum')) {
        const btnEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('Scrum Bot Quick Actions')
            .setDescription('Click the button below to refresh or use the commands listed:')
            .addFields(
                { name: '!scrum-help', value: 'Show help menu' },
                { name: '!scrum-update', value: 'Instant status check' }
            );

        const refreshButton = new ButtonBuilder()
            .setCustomId('refresh_scrum')
            .setLabel('Refresh Status')
            .setStyle(ButtonStyle.Primary)
        
        const actionRow = new ActionRowBuilder().addComponents(refreshButton);

        await message.channel.send({ embeds: [btnEmbed], components: [actionRow] });
    }
}