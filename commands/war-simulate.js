const djs = require('discord.js');
const settings = require('../settings.json');

// NOTE: I added 'Country' to the arguments here. DO NOT REMOVE IT.
module.exports.interaction = async (interaction, game, Country) => {
    await interaction.deferReply();

    const attackerCountry = interaction.options.getString('attacker');
    const defenderCountry = interaction.options.getString('defender');

    const attacker = game.getCountry(attackerCountry);
    const defender = game.getCountry(defenderCountry);

    if (!game.started) return interaction.editReply('No game has started yet.');
    if (!attacker) return interaction.editReply('Invalid attacking country specified.');
    if (!defender) return interaction.editReply('Invalid defending country specified.');
    if (attacker.country === defender.country) return interaction.editReply('That’s the same country.');

    const attackerWinChance = Country.calculateWinChance(attacker, defender);

    // Convert decimal (0.75) to percentage (75.0)
    const attackerWinPercent = (attackerWinChance * 100).toFixed(1);
    const defenderWinPercent = ((1 - attackerWinChance) * 100).toFixed(1);

    // We get the raw scores just for the display, but they don't affect the math anymore
    // (The math inside calculateWinChance handles buffs/debuffs internally)
    const attackerScore = attacker.getWarScore(); 
    const defenderScore = defender.getWarScore();

    // Build embed
    const embed = new djs.EmbedBuilder()
        .setTimestamp()
        .setColor(settings.color)
        .setFooter({
            text: `Simulation requested by ${interaction.member.displayName}`,
            iconURL: interaction.member.displayAvatarURL()
        })
        .setTitle(`War Simulation`)
        .setDescription(
            `**${attacker.country} ${attacker.flag}** vs **${defender.country} ${defender.flag}**\n\n` +
            `📊 **Base Attacker Score:** ${attackerScore}\n` +
            `🛡️ **Base Defender Score:** ${defenderScore}\n` +
            `\n🎲 **Official Win Odds:**\n` +
            `- ${attacker.country}: **${attackerWinPercent}%**\n` +
            `- ${defender.country}: **${defenderWinPercent}%**\n` +
            `\n*(Odds calculated using the new exponential system + active buffs)*`
        );

    await interaction.editReply({ embeds: [embed] });
};

module.exports.button = async interaction => { };

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('war-simulate')
        .setDescription('Simulate a war and show the odds without fighting it.')
        .addStringOption(option =>
            option.setName('attacker')
                .setDescription('The country that would attack.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('defender')
                .setDescription('The country that would defend.')
                .setRequired(true)
        );
};
