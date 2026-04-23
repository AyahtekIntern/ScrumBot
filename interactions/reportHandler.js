import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } from 'discord.js';
import { roles, reports } from '../data.js';

export async function handleSelection(interaction) {
    const { components } = interaction.message;

    const isProject = interaction.customId === 'project_select';
    const selectedValue = interaction.values[0];

    const newRows = components.map((row, index) => {
        const actionRow = ActionRowBuilder.from(row);
        
        if ((isProject && index === 0) || (!isProject && index === 1)) {
            const menu = StringSelectMenuBuilder.from(row.components[0])
                .setPlaceholder(`Selected: ${selectedValue}`);
            actionRow.setComponents(menu);
        }
        return actionRow;
    });

    const projectPlaceholder = newRows[0].components[0].data.placeholder;
    const rolePlaceholder = newRows[1].components[0].data.placeholder;
    const ready = projectPlaceholder.includes('Selected:') && rolePlaceholder.includes('Selected:');

    if (ready) {
        const enabledButton = ButtonBuilder.from(newRows[2].components[0]).setDisabled(false);
        newRows[2].setComponents(enabledButton);
    }

    await interaction.update({ components: newRows });
}

export async function handleOpenModal(interaction) {
    const project = interaction.message.components[0].components[0].placeholder.split(': ')[1];
    const role = interaction.message.components[1].components[0].placeholder.split(': ')[1];

    const modal = new ModalBuilder()
        .setCustomId(`report_modal_${project}_${role}`)
        .setTitle(`${project} - Daily Update`);

    const updateInput = new TextInputBuilder()
        .setCustomId('update_input')
        .setLabel('Updates')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const planInput = new TextInputBuilder()
        .setCustomId('plan_input')
        .setLabel('Plans')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const impedementInput = new TextInputBuilder()
        .setCustomId('impedements_input')
        .setLabel('Impedements (if any)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(updateInput),
        new ActionRowBuilder().addComponents(planInput),
        new ActionRowBuilder().addComponents(impedementInput)
    );

    await interaction.showModal(modal);

}


export async function handleModalSubmit(interaction) {

    const parts = interaction.customId.split('_');
    const projectName = parts[2];
    const role = parts[3];

    try {

        const updates = interaction.fields.getTextInputValue('update_input');
        const plans = interaction.fields.getTextInputValue('plan_input');
        const impedements = interaction.fields.getTextInputValue('impedements_input') || 'None';

        reports.push({
            userId: interaction.user.id,
            displayName: interaction.member.displayName,
            project: projectName,
            role: role,
            updates: updates,
            plans: plans,
            impedements: impedements,
            timestamp: new Date()
        });

        const successEmbed = new EmbedBuilder()
            .setColor(0x2ECC71) 
            .setTitle('Scrum Report Submitted')
            .setDescription(`Your daily update for **${projectName}** has been recorded.`)
            .addFields(
                { name: 'Role', value: role, inline: true },
                { name: 'User', value: interaction.member.displayName, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: ' Scrum Tracker' });

        await interaction.reply({ 
            embeds: [successEmbed],
            ephemeral: true 
        });

        console.log(`New report added by ${interaction.user.username}. Total reports: ${reports.length}`);

    } catch (error) {
        console.error("Error during modal submission:", error);
        
        const errorMessage = "There was an error saving your report. Please try again.";
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
}