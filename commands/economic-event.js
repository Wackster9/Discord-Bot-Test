const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => {
    // 1. Admin Check
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can cause global economic shifts.', ephemeral: true });
    }

    await interaction.deferReply();

    const modifier = interaction.options.getNumber('modifier');
    const countriesStr = interaction.options.getString('countries');
    const affectType = interaction.options.getString('affect');
    const duration = interaction.options.getInteger('duration');

    // I REMOVED THE CHECK HERE. 
    // You can now enter negative numbers (e.g., -1.5) or 0.
    
    // 2. Split and Validate Country Names
    const rawNames = countriesStr.split(',').map(name => name.trim());
    const validCountries = [];
    const invalidNames = [];

    for (const name of rawNames) {
        const c = game.getCountry(name); 
        if (c) {
            validCountries.push(c.country); 
        } else {
            invalidNames.push(name);
        }
    }

    if (invalidNames.length > 0) {
        return interaction.editReply(`❌ **Error:** I could not find the following countries:\n${invalidNames.join(', ')}\n\nPlease check your spelling.`);
    }

    const isExclusionList = affectType === 'all_except';

    if (!client.economicEvents[interaction.guild.id]) {
        client.economicEvents[interaction.guild.id] = [];
    }

    const newEvent = {
        id: Date.now(),
        modifier,
        countries: validCountries,
        isExclusionList,
        paychecksRemaining: duration
    };

    client.economicEvents[interaction.guild.id].push(newEvent);

    // Dynamic description based on whether modifier is positive or negative
    let effectDescription = '';
    if (modifier > 1) effectDescription = '📈 **BOOM:** Incomes increased.';
    else if (modifier > 0) effectDescription = '📉 **RECESSION:** Incomes reduced.';
    else if (modifier === 0) effectDescription = '❄️ **FREEZE:** Incomes stopped.';
    else effectDescription = '💸 **TAX/DEBT:** Countries are LOSING money.';

    await interaction.editReply(`**A new economic event has begun!**
${effectDescription}
- **Modifier:** ${modifier}x
- **Affects:** ${affectType === 'all_except' ? 'All countries EXCEPT' : 'ONLY'} ${validCountries.join(', ')}
- **Duration:** ${duration} paycheck cycles.
- **Event ID:** \`${newEvent.id}\``);
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('economic-event')
        .setDescription('Applies a global or targeted modifier to country income.')
        .addNumberOption(option => option.setName('modifier').setDescription('Multiplier. Use negatives (e.g. -1.0) to drain money.').setRequired(true))
        .addStringOption(option => option.setName('countries').setDescription('Comma-separated list of country names.').setRequired(true))
        .addStringOption(option =>
            option.setName('affect')
                .setDescription('Whether to include or exclude the listed countries.')
                .setRequired(true)
                .addChoices(
                    { name: 'All Countries EXCEPT Listed', value: 'all_except' },
                    { name: 'ONLY Listed Countries', value: 'only_listed' }
                )
        )
        .addIntegerOption(option => option.setName('duration').setDescription('How many paycheck cycles this event lasts.').setRequired(true));
};
