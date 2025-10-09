const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply({ ephemeral: true });

    // Check for admin permissions
    if (!interaction.member.permissions.has(djs.PermissionsBitField.Flags.Administrator)) {
        return interaction.editReply('You need administrator permissions to change country types.');
    }

    const countryName = interaction.options.getString('country');
    const newType = interaction.options.getString('type');

    const country = game.getCountry(countryName);
    if (!country) {
        return interaction.editReply('Country not found!');
    }

    // Save old type for the response
    const oldType = country.type;

    // Update the type
    country.type = newType;

    const embed = new djs.EmbedBuilder()
        .setColor(settings.color)
        .setTitle('Country Type Updated')
        .setDescription(`Changed type of **${country.country}** ${country.flag}`)
        .addFields(
            { name: 'Old Type', value: oldType, inline: true },
            { name: 'New Type', value: newType, inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('change-rank')
        .setDescription('ADMIN: Change a country\'s type (e.g., Major Powers -> Regional Powers)')
        .addStringOption(option =>
            option.setName('country')
                .setDescription('The country to modify')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The new type for the country')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator);
};