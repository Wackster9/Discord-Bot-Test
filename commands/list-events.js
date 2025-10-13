const djs = require('discord.js');

module.exports.interaction = async (interaction, game, Country, client) => {

    const events = client.economicEvents[interaction.guild.id] || [];

    if (events.length === 0) {
        return interaction.reply({ content: 'There are no active economic events.', ephemeral: true });
    }

    const embed = new djs.EmbedBuilder()
        .setTitle('Active Economic Events')
        .setColor('#FFD700');

    events.forEach(event => {
        embed.addFields({
            name: `Event ID: ${event.id}`,
            value: `
- **Modifier:** ${event.modifier}x
- **Affects:** ${event.isExclusionList ? 'All EXCEPT' : 'ONLY'} ${event.countries.join(', ')}
- **Ends in:** ${event.paychecksRemaining} paycheck(s)
            `
        });
    });

    await interaction.reply({ embeds: [embed });
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('list-events')
        .setDescription('Lists all active economic events on the server.');
};