const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => {
    // The private "no peasants allowed" message.
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can cause global economic shifts.', ephemeral: true });
    }

    // The public declaration of economic policy.
    await interaction.deferReply(); // No longer ephemeral.

    const modifier = interaction.options.getNumber('modifier');
    const countriesStr = interaction.options.getString('countries');
    const affectType = interaction.options.getString('affect');
    const duration = interaction.options.getInteger('duration');

    if (modifier <= 0) {
        return interaction.editReply('The modifier must be a positive number (e.g., 0.8 for -20%, 1.5 for +50%).');
    }

    const countries = countriesStr.split(',').map(name => name.trim());
    const isExclusionList = affectType === 'all_except';

    if (!client.economicEvents[interaction.guild.id]) {
        client.economicEvents[interaction.guild.id] = [];
    }

    const newEvent = {
        id: Date.now(), // <-- THE COMMA. BEHOLD ITS MAJESTY.
        modifier,
        countries,
        isExclusionList,
        paychecksRemaining: duration
    };

    client.economicEvents[interaction.guild.id].push(newEvent);

    // Announce it to the masses.
    await interaction.editReply(`**A new economic event has begun!**
- **Modifier:** ${modifier}x
- **Affects:** ${affectType === 'all_except' ? 'All countries EXCEPT' : 'ONLY'} ${countries.join(', ')}
- **Duration:** ${duration} paycheck cycles.
- **Event ID:** \`${newEvent.id}\``); // Also added the ID to the reply so admins can cancel it easily.
};

module.exports.application_command = () => {
    // ...
};