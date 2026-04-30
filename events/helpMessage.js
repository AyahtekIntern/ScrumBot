import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export async function execute(message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase().trim() !== '!scrum-help') return;

    try {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x3498DB) 
            .setTitle('🛠️ ScrumBot Help Guide')
            .setDescription('Welcome! Use this bot to manage daily scrum reports and track team progress.')
            .addFields(
                { 
                    name: '`/scrum`', 
                    value: 'Shows a list of all existing projects and roles, and buttons to add and delete them.' 
                },
                { 
                    name: '`/scrum-update`', 
                    value: 'Shows updates, plans, and impediments of a selected project from a specified date.' 
                },
                { 
                    name: '`/add-report`', 
                    value: 'The main command. Select your **Project** and **Role** to open the daily update form.' 
                },
                { 
                    name: '`/delete`', 
                    value: 'Delete reports within a specified date range. Select the project and date range to clear reports from.' 
                },
                { 
                    name: '`!scrum-help`', 
                    value: 'Displays this helpful menu.' 
                }
            )
            .setFooter({ text: 'MarvTek' })
            .setTimestamp();
            


        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Report a Bug')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/AyahtekIntern/ScrumBot')
        );

        await message.channel.send({ embeds: [helpEmbed], components: [row] });

    } catch (error) {
        console.error("Error in scrum-help:", error);
        await message.channel.send("Failed to load the help menu.");
    }
}