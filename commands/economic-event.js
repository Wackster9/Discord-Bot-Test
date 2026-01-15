const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => {
    // 1. Admin Check: No peasants allowed.
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can cause global economic shifts.', ephemeral: true });
    }

    await interaction.deferReply();

    const modifier = interaction.options.getNumber('modifier');
    const countriesStr = interaction.options.getString('countries');
    const affectType = interaction.options.getString('affect');
    const duration = interaction.options.getInteger('duration');

    // 2. Country Validation Logic
    // We split the list and make sure these countries actually exist.
    const rawNames = countriesStr.split(',').map(name => name.trim());
    const validCountries = [];
    const invalidNames = [];

    for (const name of rawNames) {
        const c = game.getCountry(name); 
        if (c) {
            validCountries.push(c.country); // Store the official name
        } else {
            invalidNames.push(name);
        }
    }

    // 3. Error Handling
    if (invalidNames.length > 0) {
        return interaction.editReply(`❌ **Error:** I could not find the following countries:\n${invalidNames.join(', ')}\n\nPlease check your spelling.`);
    }

    // 4. Initialize the Event Array if it doesn't exist
    if (!client.economicEvents[interaction.guild.id]) {
        client.economicEvents[interaction.guild.id] = [];
    }

    const isExclusionList = affectType === 'all_except';

    const newEvent = {
        id: Date.now(),
        modifier, // This is now an ADDITIVE number (e.g., -0.2)
        countries: validCountries,
        isExclusionList,
        paychecksRemaining: duration
    };

    client.economicEvents[interaction.guild.id].push(newEvent);

    // 5. User Feedback
    // We try to explain what the math will do so you don't panic.
    let mathExplanation = '';
    if (modifier > 0) {
        mathExplanation = `Income will INCREASE by +${(modifier * 100).toFixed(0)}% (Additive).`;
    } else if (modifier < 0) {
        mathExplanation = `Income will DECREASE by ${Math.abs(modifier * 100).toFixed(0)}% (Additive).`;
    } else {
        mathExplanation = `Income will not change (+0%). Why did you do this?`;
    }

    await interaction.editReply(`**A new economic event has begun!**
${mathExplanation}
- **Value:** ${modifier}
- **Affects:** ${affectType === 'all_except' ? 'All countries EXCEPT' : 'ONLY'} ${validCountries.join(', ')}
- **Duration:** ${duration} paycheck cycles.
- **Event ID:** \`${newEvent.id}\``);
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('economic-event')
        .setDescription('Applies a global or targeted ADDITIVE modifier to income.')
        .addNumberOption(option => 
            option.setName('modifier')
                .setDescription('Change in %. Use 0.5 for +50%, -0.2 for -20%, -1.0 for -100%.')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('countries')
                .setDescription('Comma-separated list of country names.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('affect')
                .setDescription('Whether to include or exclude the listed countries.')
                .setRequired(true)
                .addChoices(
                    { name: 'All Countries EXCEPT Listed', value: 'all_except' },
                    { name: 'ONLY Listed Countries', value: 'only_listed' }
                )
        )
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('How many paycheck cycles this event lasts.')
                .setRequired(true)
        );
};
