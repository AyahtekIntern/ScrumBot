import { EmbedBuilder } from 'discord.js';
import { reports } from '../data.js';

export async function execute(message) {
    if (message.author.bot || !message.content.startsWith('!scrum-help')) return;

    const helpEmbed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('Scrum Bot Help')
        .setDescription('Here are the available commands:')
        .addFields(
            { name: '!scrum-update', value: 'Check the daily scrum status for all members.' },
            { name: '!scrum-help', value: 'Display this help message.' },
            { name: '/add-project', value: 'Add a new project to the list.' },
            { name: '/add-report', value: 'Add a new report to the list.' }
        );

    await message.channel.send({ embeds: [helpEmbed] });

}