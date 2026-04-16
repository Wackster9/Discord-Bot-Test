const djs = require('discord.js');

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('take-loan')
        .setDescription('Sell your country\'s future for immediate cash. A terrible idea.')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The amount of money you wish to borrow.')
                .setRequired(true)
                .setMinValue(1)
        );
};

module.exports.interaction = async (interaction, game) => {
    const player = game.getPlayer(interaction.user.id);
    if (!player) {
        return interaction.reply({ content: 'You must control a country to ruin its economy.', ephemeral: true });
    }

    const grossIncome = player.industry / 20;
    const maxLoanAmount = Math.floor(grossIncome * 2);

    if (maxLoanAmount <= 4) {
        return interaction.reply({ content: `Your industry is too weak. No one will give you a loan.`, ephemeral: true });
    }

    const loanAmount = interaction.options.getInteger('amount');
    

    if (loanAmount > maxLoanAmount) {
        return interaction.reply({ content: `Your credit is not that good. The maximum loan you can take at this time is **$${maxLoanAmount}**.`, ephemeral: true });
    }

    const debtIncurred = Math.floor(loanAmount * 1.25); 

    player.money += loanAmount;
    player.debt += debtIncurred;

    await interaction.reply(`💸 **Loan Acquired.** You have received **$${loanAmount}**. Your national debt has increased by **$${debtIncurred}**. Your new total debt is **$${player.debt}**.`);
};