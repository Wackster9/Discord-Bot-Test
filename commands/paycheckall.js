const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { aiSpend } = require('../index.js'); // import the helper

module.exports.application_command = () =>
    new SlashCommandBuilder()
        .setName('paycheckall')
        .setDescription('Distributes paychecks to all countries.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports.interaction = async (interaction, game) => {
    if (!game.started) {
        return await interaction.reply({
            content: 'The game hasn’t started yet!',
            ephemeral: true
        });
    }

    const addedMoney = [];

    game.countries.forEach(c => {
        const paycheck = Math.floor(c.industry / 20);
        c.money += paycheck;
        addedMoney.push(`${c.country}: $${paycheck}`);

        // Trigger AI spending for unclaimed countries
        if (!c.pid) {
            aiSpend(c, interaction.guild.id, interaction.client);
        }
    });

    const responseMessage = addedMoney.length > 0
        ? `💰 Paycheck distribution:\n${addedMoney.join('\n')}`
        : 'No countries received money.';

    await interaction.reply({
        content: responseMessage,
    });
};
