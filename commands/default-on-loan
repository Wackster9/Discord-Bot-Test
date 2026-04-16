// commands/default.js
const { SlashCommandBuilder } = require('discord.js');

module.exports.application_command = () => {
    return new SlashCommandBuilder()
        .setName('default')
        .setDescription('Refuse to pay your debt to a specific country. This is a hostile act.')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('The country whose loan you are defaulting on.')
                .setRequired(true)
        );
};

module.exports.interaction = async (interaction, game) => {
    const borrower = game.getPlayer(interaction.user.id);
    if (!borrower) {
        return interaction.reply({ content: 'You must control a country to default on its debts.', ephemeral: true });
    }

    const lenderName = interaction.options.getString('target');
    const lender = game.getCountry(lenderName);
    if (!lender) {
        return interaction.reply({ content: `Target country '${lenderName}' not found. You can't default on a loan to a ghost.`, ephemeral: true });
    }

    // This is the correct way to check. Are you taking notes?
    if (!borrower.debts || !borrower.debts[lender.country]) {
        return interaction.reply({ content: `You don't owe any debt to **${lender.country}**.`, ephemeral: true });
    }

    const debt = borrower.debts[lender.country];
    const defaultedAmount = Math.ceil(debt.currentPrincipal);

    // The act. Simple. Brutal.
    delete borrower.debts[lender.country];

    const replyMessage = `🚨 **You have defaulted!** Your debt of **$${defaultedAmount.toLocaleString()}** to **${lender.country}** has been wiped from your books. This is an act of economic hostility. What happens next is up to them.`;

    await interaction.reply({ content: replyMessage });

    // Notify the lender. This is where the real game begins.
    if (lender.pid) {
        try {
            const lenderUser = await interaction.client.users.fetch(lender.pid);
            lenderUser.send(`**‼️ DEBT DEFAULT!**\n**${borrower.country}** has officially defaulted on their loan to you! Your outstanding principal of **$${defaultedAmount.toLocaleString()}** has been lost. They have chosen anarchy. Your move.`);
        } catch {
            // If DMs fail, announce it publicly. The drama must be shared.
            interaction.channel.send(`**Public Notice:** <@${lender.pid}>, be advised that **${borrower.country}** has defaulted on their debt to you. The international community watches with great interest.`);
        }
    } else {
        interaction.channel.send(`**Public Notice:** **${borrower.country}** has defaulted on its loan to the un-manned nation of **${lender.country}**. The money has vanished into the ether.`);
    }
};