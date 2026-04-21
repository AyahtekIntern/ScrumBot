import { reports } from '../data.js';

export async function execute(message) {
    if (message.author.bot || !message.content.startsWith('!scrum-update')) return;

    const members = await message.guild.members.fetch();
    const humanMembers = members.filter(member => !member.user.bot);

    let statusList = "**Global Scrum Status:**\n";
    humanMembers.forEach(member => {
        const username = member.user.username;
        const hasUpdated = reports.some(r => r.username === username);
        statusList += `**${username}**: ${hasUpdated ? 'Yes' : 'No Updates'}\n`;
    });

    await message.channel.send(statusList);
}