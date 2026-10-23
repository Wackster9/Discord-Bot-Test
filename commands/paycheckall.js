const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports.application_command = () =>
    new SlashCommandBuilder()
        .setName('paycheckall')
        .setDescription('Distributes paychecks to all countries.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// FIX 1: Accept all 5 arguments from index.js! Stop ignoring Country, Front, and client.
module.exports.interaction = async (interaction, game, Country, Front, client) => {
    if (!game.started) {
        return await interaction.reply({
            content: 'The game hasn’t started yet!',
            ephemeral: true
        });
    }

    const addedMoney = [];
    const guildId = interaction.guild.id;
    
    // FIX 2: Bring in your Economic Events!
    const events = client.economicEvents?.[guildId] || []; 

    game.countries.forEach(c => {
        // Safe access to tankUpkeep and armyUpkeep using ?.
        const basePaycheck = (c.industry / 20) - (
            c.tank * (client.tankUpkeep?.[guildId] || 0) + 
            c.army * (client.armyUpkeep?.[guildId] || 0)
        );

        // FIX 3: Apply the economic event modifiers you worked so hard on
        let totalPercentChange = 0;
        events.forEach(event => {
            const isCountryInList = event.countries.includes(c.country);
            const shouldBeAffected = event.isExclusionList ? !isCountryInList : isCountryInList;
            
            if (shouldBeAffected) {
                totalPercentChange += event.modifier;
            }
        });

        const finalModifier = 1.0 + totalPercentChange;
        const finalPaycheck = basePaycheck * finalModifier;

        c.money += finalPaycheck;
        addedMoney.push(`${c.country}: $${finalPaycheck.toFixed(2)}`);

        // Trigger AI spending for unclaimed countries
        if (!c.pid) {
            game.aiSpend(c, guildId, client);
        }
    });

    // Decrease the remaining duration of active events
    if (events.length > 0) {
        events.forEach(event => event.paychecksRemaining--);
        client.economicEvents[guildId] = events.filter(event => event.paychecksRemaining > 0);
    }

    const responseMessage = addedMoney.length > 0
        ? `💰 Paycheck distribution (Modifiers Applied):\n${addedMoney.join('\n')}`
        : 'No countries received money.';

    await interaction.reply({
        content: responseMessage,
    });
};
