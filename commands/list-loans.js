// commands/list-loans.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('list-loans')
        .setDescription("View your country's financial statement of assets and liabilities.");
};

module.exports.interaction = async (interaction, game) => {
    const player = game.getPlayer(interaction.user.id);
    if (!player) {
        return interaction.reply({ content: 'You must control a country to view its financials.', ephemeral: true });
    }

    const assets = [];
    const liabilities = [];

    // First, find your liabilities. This is the easy part. You're just looking at your own pockets.
    if (player.debts && Object.keys(player.debts).length > 0) {
        for (const lenderName in player.debts) {
            const debt = player.debts[lenderName];
            const paymentDue = (debt.originalPrincipal * debt.paymentRate).toLocaleString();
            liabilities.push(
                `- Owed to **${lenderName}**: **$${Math.ceil(debt.currentPrincipal).toLocaleString()}** at ${(debt.interestRate * 100).toFixed(1)}% (Paying $${paymentDue}/cycle)`
            );
        }
    }

    // Now, find your assets. This is the fun part. You check everyone else's pockets for your money.
    for (const debtor of game.countries) {
        if (debtor.debts && debtor.debts[player.country]) {
            const debt = debtor.debts[player.country];
            const paymentIncoming = (debt.originalPrincipal * debt.paymentRate).toLocaleString();
            assets.push(
                `- Owed by **${debtor.country}**: **$${Math.ceil(debt.currentPrincipal).toLocaleString()}** at ${(debt.interestRate * 100).toFixed(1)}% (Receiving $${paymentIncoming}/cycle)`
            );
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Financial Report for ${player.flag} ${player.country}`)
        .setTimestamp();

    if (assets.length > 0) {
        embed.addFields({ name: '📈 Assets (Loans Given)', value: assets.join('\n') });
    } else {
        embed.addFields({ name: '📈 Assets (Loans Given)', value: 'You have not given out any loans.' });
    }

    if (liabilities.length > 0) {
        embed.addFields({ name: '📉 Liabilities (Debts Owed)', value: liabilities.join('\n') });
    } else {
        embed.addFields({ name: '📉 Liabilities (Debts Owed)', value: 'You are not in debt to any nation. How boring.' });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
};