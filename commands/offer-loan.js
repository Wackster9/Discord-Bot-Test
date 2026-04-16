const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require('crypto');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('offer-loan')
        .setDescription('Offer a loan to another country.')
        .addStringOption(option => option.setName('target').setDescription('The country you want to indebt.').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of cash to offer.').setRequired(true).setMinValue(1))
        .addIntegerOption(option => option.setName('premium').setDescription('The one-time interest premium percentage (e.g., 25 for 25%).').setRequired(true).setMinValue(0));
};

module.exports.interaction = async (interaction, game) => {
    const player = game.getPlayer(interaction.user.id);
    if (!player) return interaction.reply({ content: 'You must control a country.', ephemeral: true });

    const targetName = interaction.options.getString('target');
    const target = game.getCountry(targetName);
    if (!target || !target.pid) return interaction.reply({ content: 'Target country not found or is unclaimed.', ephemeral: true });

    const amount = interaction.options.getInteger('amount');
    const premium = interaction.options.getInteger('premium');

    if (player.money < amount) return interaction.reply({ content: `You cannot offer a loan of $${amount} as you only have $${player.money}.`, ephemeral: true });

    const proposalId = crypto.randomUUID();
    const proposal = {
        id: proposalId,
        type: 'offer',
        lender: player.country,
        borrower: target.country,
        principal: amount,
        premium: Math.floor(amount * (premium / 100)),
        status: 'pending'
    };
    game.loanProposals.push(proposal);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`loan-accept-${proposalId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`loan-decline-${proposalId}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({ content: `Your loan offer has been sent to **${target.country}**.`, ephemeral: true });
    
    try {
        const targetUser = await interaction.client.users.fetch(target.pid);
        await targetUser.send({
            content: `**Loan Offer Received!**\n**${player.country}** has offered you a loan of **$${amount}**. If accepted, you will owe them back **$${proposal.principal + proposal.premium}** over time.`,
            components: [row]
        });
    } catch {
        // We can't DM them, so we send a public ping instead.
        await interaction.channel.send({ content: `<@${target.pid}>, **${player.country}** has sent you a loan offer. Since I cannot DM you, please use the buttons below.`, components: [row] });
    }
};