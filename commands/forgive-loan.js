// commands/forgive-loan.js
const { SlashCommandBuilder } = require('discord.js');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('forgive-loan')
        .setDescription('Forgive a portion or all of the debt a country owes to you.')
        .addStringOption(option => 
            option.setName('target')
                .setDescription('The debtor country whose debt you are forgiving.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of principal to forgive (optional, defaults to ALL).')
                .setRequired(false)
                .setMinValue(1)
        );
};

module.exports.interaction = async (interaction, game) => {
    const lender = game.getPlayer(interaction.user.id);
    if (!lender) return interaction.reply({ content: 'You must control a country to forgive debt.', ephemeral: true });

    const targetName = interaction.options.getString('target');
    const borrower = game.getCountry(targetName);
    if (!borrower) return interaction.reply({ content: `Target country '${targetName}' not found.`, ephemeral: true });

    if (!borrower.debts || !borrower.debts[lender.country]) {
        return interaction.reply({ content: `**${borrower.country}** does not currently owe you any debt.`, ephemeral: true });
    }

    const debt = borrower.debts[lender.country];
    let amountToForgive = interaction.options.getInteger('amount');

    // Forgive ALL
    if (!amountToForgive || amountToForgive >= debt.currentPrincipal) {
        const totalOwed = Math.ceil(debt.currentPrincipal);
        delete borrower.debts[lender.country];

        await interaction.reply(`🕊️ **Debt Forgiven!** In an act of profound generosity, you have forgiven the entire remaining principal of **$${totalOwed.toLocaleString()}** owed by **${borrower.country}**.`);

        if (borrower.pid) {
            try {
                const borrowerUser = await interaction.client.users.fetch(borrower.pid);
                borrowerUser.send(`**Your debt has been forgiven!** **${lender.country}** has wiped your entire slate clean.`);
            } catch {}
        }
        return;
    }

    // Forgive a partial amount
    debt.currentPrincipal -= amountToForgive;

    await interaction.reply(`💸 **Partial Debt Forgiven!** You have forgiven **$${amountToForgive.toLocaleString()}** of principal owed by **${borrower.country}**. Their remaining principal is now **$${Math.ceil(debt.currentPrincipal).toLocaleString()}**.`);

    if (borrower.pid) {
        try {
            const borrowerUser = await interaction.client.users.fetch(borrower.pid);
            borrowerUser.send(`**Partial Debt Relief!** **${lender.country}** has forgiven **$${amountToForgive.toLocaleString()}** of your debt to them.`);
        } catch {}
    }
};