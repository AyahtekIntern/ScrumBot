import { EmbedBuilder } from 'discord.js';
import { reports } from '../data.js';

export async function handleButtonInteraction(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'refresh_scrum') {
        try {
            await interaction.deferUpdate();

            
            const members = await interaction.guild.members.fetch();
            const humanMembers = members.filter(member => !member.user.bot);

            const scrumFields = humanMembers.map(member => {
                const hasUpdated = reports.some(r => String(r.userId) === String(member.id));
                return {
                    name: member.displayName,
                    value: hasUpdated ? ' Submitted' : 'No Updates',
                    inline: true 
                };
            });

            const updatedEmbed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('Daily Scrum Status (Refreshed)')
                .setDescription(`Last updated: <t:${Math.floor(Date.now() / 1000)}:R>`)
                .addFields(scrumFields)
                .setTimestamp();

            await interaction.editReply({ embeds: [updatedEmbed] });

        } catch (error) {
            console.error("Button Refresh Error:", error);
            await interaction.followUp({ content: 'Could not refresh status.', ephemeral: true });
        }
    }
}