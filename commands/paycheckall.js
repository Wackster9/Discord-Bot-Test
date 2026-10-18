const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
    const client = interaction.client;
    const guildId = interaction.guild.id;


    game.countries.forEach(c => {
        const paycheck = (c.industry / 20) - (c.tank * (client.tankUpkeep[guildId] || 0) + c.army * (client.armyUpkeep[guildId] || 0));
        c.money += paycheck;
        addedMoney.push(`${c.country}: $${paycheck}`);

        // Trigger AI spending for unclaimed countries
        if (!c.pid) {
            game.aiSpend(c, interaction.guild.id, interaction.client);
        }
    });

    const responseMessage = addedMoney.length > 0
        ? `💰 Paycheck distribution:\n${addedMoney.join('\n')}`
        : 'No countries received money.';

    await interaction.reply({
        content: responseMessage,
    });
};
