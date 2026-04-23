import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export async function execute(message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase().trim() !== '!scrum-help') return;

    try {
        const helpEmbed = new EmbedBuilder()
            .setThumbnail('https://cdn.discordapp.com/attachments/1495990531589804034/1496773824354586664/SkrumBol_iskrabol_clean.png?ex=69eb1ac0&is=69e9c940&hm=d811fe3061656dda3a69153a112375da2ab660956d3a0118409572c4079d485f&')
            .setColor(0x3498DB) 
            .setTitle('🛠️ ScrumBot Help Guide')
            .setDescription('Welcome! Use this bot to manage daily scrum reports and track team progress.')
            .addFields(
                {
                    name: '`/add-project`',
                    value: 'Add a new project to the database.'
                },
                { 
                    name: '`/add-report`', 
                    value: 'The main command. Select your **Project** and **Role** to open the daily update form.' 
                },
                { 
                    name: '`!scrum-update`', 
                    value: 'Shows a real-time list of who has submitted their report for today and who is still missing.' 
                },
                { 
                    name: '`!scrum-help`', 
                    value: 'Displays this helpful menu.' 
                }
            )
            .setFooter({ text: 'SkramBol' })
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