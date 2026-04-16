const djs = require('discord.js');

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('pay-debt')
        .setDescription('Make a payment on your crippling national debt.')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The amount of money you will use to pay down your debt.')
                .setRequired(true)
                .setMinValue(1)
        );
};

module.exports.interaction = async (interaction, game) => {
    const player = game.getPlayer(interaction.user.id);
    if (!player) {
        return interaction.reply({ content: 'You have no country to have debt with. Lucky you.', ephemeral: true });
    }

    if (player.debt <= 0) {
        return interaction.reply({ content: 'Your nation is debt-free. A rare and beautiful thing. Do not ruin it.', ephemeral: true });
    }

    const paymentAmount = interaction.options.getInteger('amount');

    if (paymentAmount > player.money) {
        return interaction.reply({ content: `You only have **$${player.money}**. You cannot afford to pay **$${paymentAmount}**.`, ephemeral: true });
    }
    
    // Allow players to pay more than their debt, but cap it at the debt amount
    const actualPayment = Math.min(paymentAmount, player.debt);

    player.money -= actualPayment;
    player.debt -= actualPayment;

    await interaction.reply(`✅ **Debt Serviced.** You have paid **$${actualPayment}** toward your national debt. Your remaining debt is now **$${player.debt}**.`);
};