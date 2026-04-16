// offer-loan.js (The "Caveat Emptor" Edition)
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require('crypto');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('offer-loan')
        .setDescription('Offer a loan with specific terms to another country.')
        .addStringOption(option => option.setName('target').setDescription('The country you want to indebt.').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The principal amount of cash to offer.').setRequired(true).setMinValue(1))
        .addNumberOption(option => 
            option.setName('interest-rate')
                .setDescription('The interest rate PER PAYCHECK CYCLE (e.g., 5 for 5%).')
                .setRequired(true)
                .setMinValue(0)
        )
        .addNumberOption(option => 
            option.setName('payment-rate')
                .setDescription('The percentage of the original principal they must pay each cycle (e.g., 10 for 10%).')
                .setRequired(true)
                .setMinValue(1)
        );
};

module.exports.interaction = async (interaction, game) => {
    const player = game.getPlayer(interaction.user.id);
    if (!player) return interaction.reply({ content: 'You must control a country.', ephemeral: true });

    const targetName = interaction.options.getString('target');
    const target = game.getCountry(targetName);
    if (!target || !target.pid) return interaction.reply({ content: 'Target country not found or is unclaimed.', ephemeral: true });

    if (target.pid === interaction.user.id) {
        return interaction.reply({ content: 'You cannot offer a loan to yourself. Are you trying to cause a singularity?', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    const interestRate = interaction.options.getNumber('interest-rate');
    const paymentRate = interaction.options.getNumber('payment-rate');

    if (player.money < amount) return interaction.reply({ content: `You only have $${player.money.toLocaleString()} and cannot offer a loan of $${amount.toLocaleString()}.`, ephemeral: true });

    const proposalId = crypto.randomUUID();
    const proposal = {
        id: proposalId,
        type: 'offer',
        lender: player.country,
        borrower: target.country,
        principal: amount,
        interestRate: interestRate / 100,
        paymentRate: paymentRate / 100,
        status: 'pending'
    };

    const interestPerCycle = amount * proposal.interestRate;
    const paymentPerCycle = amount * proposal.paymentRate;

    // Ahem, a reminder. You still need to add `this.loanProposals = [];` to your Game class constructor.
    if (!game.loanProposals) game.loanProposals = []; 
    game.loanProposals.push(proposal);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`loan-accept-${proposalId}`).setLabel('Accept Terms').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`loan-decline-${proposalId}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({ content: `Your loan offer has been sent to **${target.country}**.`, ephemeral: true });

    // The new, beautifully neutral message. It gives them the numbers. The rest is up to them.
    const dmContent = `**Loan Offer Received from ${player.country}**\n\n` +
        `You have been offered a loan with the following terms:\n` +
        `> **Principal Amount:** $${amount.toLocaleString()}\n` +
        `> **Interest Rate:** ${interestRate}% per paycheck cycle\n` +
        `> **Mandatory Payment:** $${paymentPerCycle.toLocaleString()} per paycheck cycle\n\n` +
        `For your reference, the interest on the first cycle would be **$${interestPerCycle.toLocaleString()}**. You are responsible for understanding these terms before accepting.`;

    try {
        const targetUser = await interaction.client.users.fetch(target.pid);
        await targetUser.send({ content: dmContent, components: [row] });
    } catch {
        await interaction.channel.send({ content: `<@${target.pid}>, you have received a loan offer from **${player.country}**. Please check your DMs or use the buttons below.`, components: [row] });
    }
};