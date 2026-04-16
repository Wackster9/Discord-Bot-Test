const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => {

    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can cancel events.', ephemeral: true });
    }

    // Public record-keeping
    await interaction.deferReply(); 

    const eventId = interaction.options.getString('id');
    const events = client.economicEvents[interaction.guild.id] || [];

    const eventExists = events.some(event => event.id.toString() === eventId);

    if (!eventExists) {
        return interaction.editReply({ content: `No event with that ID was found. Publicly.` }); // Public failure.
    }

    // Filter the events array, keeping everything EXCEPT the event with the matching ID
    client.economicEvents[interaction.guild.id] = events.filter(event => event.id.toString() !== eventId);

    // Announce the cancellation 
    await interaction.editReply({ content: `The economic event with ID **${eventId}** has been officially canceled.` });
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('cancel-event')
        .setDescription('Cancels an active economic event by its ID.')
        .addStringOption(option => option.setName('id').setDescription('The ID of the event to cancel (use /list-events).').setRequired(true));
};