const djs = require('discord.js');

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('set-interest-rate')
        .setDescription('Sets the global interest rate for all new and existing debt.')
        .setDefaultMemberPermissions(djs.PermissionFlagsBits.Administrator)
        .addNumberOption(option => 
            option.setName('rate')
                .setDescription('The new interest rate as a decimal (e.g., 0.05 for 5%).')
                .setRequired(true)
        );
};

module.exports.interaction = async (interaction, game, Country, client) => {
    if (!game.started) {
        return interaction.reply({ content: 'The game has not started. No need to set rates for a world at peace.', ephemeral: true });
    }

    const newRate = interaction.options.getNumber('rate');

    if (newRate < 0) {
        return interaction.reply({ content: 'You cannot set a negative interest rate. This is a game, not a theoretical economics paper.', ephemeral: true });
    }

    client.interestRates[interaction.guild.id] = newRate;

    await interaction.reply(`📈 **Global Interest Rate Updated.** The new interest rate has been set to **${(newRate * 100).toFixed(2)}%**. All nations will feel the effects on the next paycheck cycle.`);
};