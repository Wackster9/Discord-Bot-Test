const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
    if (!lender) {
        return interaction.reply({ content: 'You must control a country to forgive debt.', ephemeral: true });
    }

    const targetName = interaction.options.getString('target');
    const borrower = game.getCountry(targetName);
    if (!borrower) {
        return interaction.reply({ content: `Target country '${targetName}' not found.`, ephemeral: true });
    }

    // Check if the borrower actually owes this lender money
    if (!borrower.debts[lender.country] || borrower.debts[lender.country].principal <= 0) {
        return interaction.reply({ content: `**${borrower.country}** does not currently owe you any debt.`, ephemeral: true });
    }

    const currentDebt = borrower.debts[lender.country];
    let amountToForgive = interaction.options.getInteger('amount');

    // If no amount is specified, forgive the entire debt (principal and premium).
    if (!amountToForgive) {
        const totalOwed = currentDebt.principal + currentDebt.premium;
        delete borrower.debts[lender.country]; // Wipe the slate clean

        await interaction.reply(`🕊️ **Debt Forgiven!** In an act of profound generosity, you have forgiven the entire debt of **$${totalOwed}** owed to you by **${borrower.country}**.`);
        
        if (borrower.pid) {
            try {
                const borrowerUser = await interaction.client.users.fetch(borrower.pid);
                borrowerUser.send(`**Your debt has been forgiven!** **${lender.country}** has wiped your entire slate clean.`);
            } catch {}
        }
        return;
    }

    // If an amount is specified, only forgive that much of the principal.
    if (amountToForgive > currentDebt.principal) {
        return interaction.reply({ content: `You cannot forgive more principal than they owe. They currently owe you **$${currentDebt.principal}** in principal.`, ephemeral: true });
    }

    // Forgive a partial amount. We'll forgive a proportional amount of the premium as well.
    const proportion = amountToForgive / currentDebt.principal;
    const premiumForgiven = Math.floor(currentDebt.premium * proportion);

    currentDebt.principal -= amountToForgive;
    currentDebt.premium -= premiumForgiven;

    const totalValueForgiven = amountToForgive + premiumForgiven;

    // If the remaining principal is zero or less, clear the debt entirely.
    if (currentDebt.principal <= 0) {
        delete borrower.debts[lender.country];
    }

    await interaction.reply(`💸 **Partial Debt Forgiven!** You have forgiven **$${amountToForgive}** of principal (and **$${premiumForgiven}** of the associated premium) owed by **${borrower.country}**. They are surely grateful.`);

    if (borrower.pid) {
        try {
            const borrowerUser = await interaction.client.users.fetch(borrower.pid);
            borrowerUser.send(`**Partial Debt Relief!** **${lender.country}** has forgiven **$${totalValueForgiven}** of your debt to them.`);
        } catch {}
    }
};