const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require('crypto');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('request-loan')
        .setDescription('Go begging for money from a richer, more powerful nation.')
        .addStringOption(option => option.setName('target').setDescription('The country you are requesting a loan from.').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of cash you are requesting.').setRequired(true).setMinValue(1));
};

module.exports.interaction = async (interaction, game) => {
    const player = game.getPlayer(interaction.user.id);
    if (!player) return interaction.reply({ content: 'You must control a country to beg for money.', ephemeral: true });

    const targetName = interaction.options.getString('target');
    const target = game.getCountry(targetName);
    if (!target || !target.pid) return interaction.reply({ content: 'Target country not found or is unclaimed.', ephemeral: true });

    const amount = interaction.options.getInteger('amount');

    const proposalId = crypto.randomUUID();
    const proposal = {
        id: proposalId,
        type: 'request',
        lender: target.country,
        borrower: player.country,
        principal: amount,
        status: 'pending' // Just pending in general now
    };
    game.loanProposals.push(proposal);

    // Note the new button IDs for the lender
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`lender-approve-${proposalId}`).setLabel('Approve (Default Rate)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`lender-modify-${proposalId}`).setLabel('Set Custom Rate').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`lender-decline-${proposalId}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({ content: `Your loan request has been sent to **${target.country}**.`, ephemeral: true });
    
    try {
        const targetUser = await interaction.client.users.fetch(target.pid);
        await targetUser.send({
            content: `**Loan Request Received!**\n**${player.country}** is requesting a loan of **$${amount}** from you. Please respond below.`,
            components: [row]
        });
    } catch {
        await interaction.channel.send({ content: `<@${target.pid}>, **${player.country}** is requesting a loan from you.`, components: [row] });
    }
};