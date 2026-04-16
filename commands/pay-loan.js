// pay-debt.js
const { SlashCommandBuilder } = require('discord.js');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('pay-debt')
        .setDescription('Make a manual payment on a loan to reduce the principal.')
        .addStringOption(option => 
            option.setName('target')
                .setDescription('The country you owe money to.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of principal you wish to pay off.')
                .setRequired(true)
                .setMinValue(1)
        );
};

module.exports.interaction = async (interaction, game) => {
    const borrower = game.getPlayer(interaction.user.id);
    if (!borrower) {
        return interaction.reply({ content: 'You must control a country to pay off debts. Who did you think owed the money?', ephemeral: true });
    }

    const lenderName = interaction.options.getString('target');
    const lender = game.getCountry(lenderName);
    if (!lender) {
        return interaction.reply({ content: `Target country '${lenderName}' not found. Are you sure you didn't just misplace the money?`, ephemeral: true });
    }

    // This is the correct way to check. Did you learn nothing?
    if (!borrower.debts || !borrower.debts[lender.country]) {
        return interaction.reply({ content: `You don't owe any debt to **${lender.country}**. Congratulations on your solvency, I guess.`, ephemeral: true });
    }

    const debt = borrower.debts[lender.country];
    let amountToPay = interaction.options.getInteger('amount');

    if (borrower.money < amountToPay) {
        return interaction.reply({ content: `You only have **$${borrower.money.toLocaleString()}**. You cannot afford to pay **$${amountToPay.toLocaleString()}**. Basic arithmetic is a prerequisite for this game.`, ephemeral: true });
    }

    let replyMessage = '';

    // If the player tries to pay more than they owe, we'll just cap it. No need to be difficult.
    if (amountToPay > debt.currentPrincipal) {
        amountToPay = Math.ceil(debt.currentPrincipal); // Use Math.ceil to avoid floating point dust.
        replyMessage += `(Note: Your payment was adjusted to **$${amountToPay.toLocaleString()}** to match the remaining principal.)\n\n`;
    }

    // The Transaction
    borrower.money -= amountToPay;
    lender.money += amountToPay;
    debt.currentPrincipal -= amountToPay;

    // Check if the loan is fully paid off
    if (debt.currentPrincipal <= 0) {
        const totalPaid = debt.originalPrincipal + (debt.totalInterestPaid || 0) + amountToPay; // Track total interest for a final receipt.
        delete borrower.debts[lender.country];

        replyMessage += `🎉 **Debt Paid in Full!** You have successfully paid off your loan to **${lender.country}**. You are no longer under their thumb. Your financial freedom has been restored. For now.`;
        
        await interaction.reply({ content: replyMessage });

        // Notify the lender they've been paid back.
        if (lender.pid) {
            try {
                const lenderUser = await interaction.client.users.fetch(lender.pid);
                lenderUser.send(`💰 **Loan Repaid!** **${borrower.country}** has made their final payment and completely paid off their debt to you. The money has been transferred.`);
            } catch (err) {
                console.log(`Failed to DM lender ${lender.pid} about a paid-off loan.`);
            }
        }

    } else {
        // Just a partial payment
        replyMessage += `💸 **Payment Successful!** You paid **$${amountToPay.toLocaleString()}** towards your debt to **${lender.country}**. Your remaining principal is now **$${Math.ceil(debt.currentPrincipal).toLocaleString()}**. Keep shoveling.`;
        
        await interaction.reply({ content: replyMessage });

        // Notify the lender of the partial payment.
        if (lender.pid) {
            try {
                const lenderUser = await interaction.client.users.fetch(lender.pid);
                lenderUser.send(`💰 **Loan Payment Received!** **${borrower.country}** has made a manual payment of **$${amountToPay.toLocaleString()}** towards their loan. The money has been transferred.`);
            } catch (err) {
                console.log(`Failed to DM lender ${lender.pid} about a partial payment.`);
            }
        }
    }
    
};