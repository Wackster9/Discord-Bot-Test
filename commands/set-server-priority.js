const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => { // Note: we need 'client' here!
    // Make sure the user is an admin
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can use this command.', ephemeral: true });
    }
    
    // IMPORTANT! Update the interactionCreate event in your main file to pass `client` to commands.
    // It should look like this: await command.interaction(interaction, game, Country, client);

    await interaction.deferReply({ ephemeral: true });

    const army = interaction.options.getInteger('army');
    const industry = interaction.options.getInteger('industry');
    const tank = interaction.options.getInteger('tank');

    if (army + industry + tank !== 100) {
        return interaction.editReply('The priorities must add up to 100.');
    }

    // Set the server-wide priorities
    client.aiPriorities[interaction.guild.id] = { army, industry, tank };

    await interaction.editReply(`Successfully set the default server AI priorities to:\nArmy: ${army}%\nIndustry: ${industry}%\nTank: ${tank}%`);
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('set-server-priority')
        .setDescription('Sets the default AI spending priorities for all AI countries in this server.')
        .addIntegerOption(option => option.setName('army').setDescription('Percentage for army (0-100).').setRequired(true))
        .addIntegerOption(option => option.setName('industry').setDescription('Percentage for industry (0-100).').setRequired(true))
        .addIntegerOption(option => option.setName('tank').setDescription('Percentage for tank (0-100).').setRequired(true));
};