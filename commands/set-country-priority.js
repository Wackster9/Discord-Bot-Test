const djs = require('discord.js');

module.exports.interaction = async (interaction, game) => {
    // Make sure the user is an admin
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can use this command.', ephemeral: true });
    }

    await interaction.deferReply();

    const countryName = interaction.options.getString('country');
    const army = interaction.options.getInteger('army');
    const industry = interaction.options.getInteger('industry');
    const tank = interaction.options.getInteger('tank');

    const country = game.getCountry(countryName);

    if (!country) {
        return interaction.editReply('Invalid country specified.');
    }
    if (army + industry + tank !== 100) {
        return interaction.editReply('The priorities must add up to 100.');
    }

    // Set the specific priorities for this one country
    country.aiPriorities = { army, industry, tank };

    await interaction.editReply(`Successfully set AI priorities for ${country.country} to:\nArmy: ${army}%\nIndustry: ${industry}%\nTank: ${tank}%`);
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('set-country-priority')
        .setDescription('Sets the AI spending priorities for a specific AI country.')
        .addStringOption(option => option.setName('country').setDescription('The country to set priorities for.').setRequired(true))
        .addIntegerOption(option => option.setName('army').setDescription('Percentage for army (0-100).').setRequired(true))
        .addIntegerOption(option => option.setName('industry').setDescription('Percentage for industry (0-100).').setRequired(true))
        .addIntegerOption(option => option.setName('tank').setDescription('Percentage for tank (0-100).').setRequired(true));
};