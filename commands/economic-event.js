const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => {
    // The private "no peasants allowed" message.
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can cause global economic shifts. mrrow...', ephemeral: true });
    }

    // The public declaration of economic policy.
    await interaction.deferReply();

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
        id: Date.now(),
        modifier,
        countries,
        isExclusionList,
        paychecksRemaining: duration
    };

    client.economicEvents[interaction.guild.id].push(newEvent);

    await interaction.editReply(`**A new economic event has begun!**
- **Modifier:** ${modifier}x
- **Affects:** ${affectType === 'all_except' ? 'All countries EXCEPT' : 'ONLY'} ${countries.join(', ')}
- **Duration:** ${duration} paycheck cycles.
- **Event ID:** \`${newEvent.id}\``);
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('economic-event')
        .setDescription('Applies a global or targeted modifier to country income.')
        .addNumberOption(option => option.setName('modifier').setDescription('The income multiplier (e.g., 1.5 for +50%).').setRequired(true))
        .addStringOption(option => option.setName('countries').setDescription('A comma-separated list of country names.').setRequired(true))
        .addStringOption(option =>
            option.setName('affect')
                .setDescription('Whether to include or exclude the listed countries.')
                .setRequired(true)
                .addChoices(
                    { name: 'All Countries EXCEPT Listed', value: 'all_except' },
                    { name: 'ONLY Listed Countries', value: 'only_listed' } // <-- FIXED
                )
        )
        .addIntegerOption(option => option.setName('duration').setDescription('How many paycheck cycles this event lasts.').setRequired(true));
};