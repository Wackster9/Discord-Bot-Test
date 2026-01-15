const djs = require('discord.js');
const settings = require('../settings.json');

// NOTE: I added 'Country' to the arguments here. DO NOT REMOVE IT.
module.exports.interaction = async (interaction, game, Country) => {
    await interaction.deferReply();

    const attackerCountry = interaction.options.getString('attacker');
    const defenderCountry = interaction.options.getString('defender');
    const armyAmount = interaction.options.getInteger('army'); // NEW: Get the army amount

    const attacker = game.getCountry(attackerCountry);
    const defender = game.getCountry(defenderCountry);

    if (!game.started) return interaction.editReply('No game has started yet.');
    if (!attacker) return interaction.editReply('Invalid attacking country specified.');
    if (!defender) return interaction.editReply('Invalid defending country specified.');
    if (attacker.country === defender.country) return interaction.editReply('That’s the same country.');

    // NEW: Validation for simulation
    if (armyAmount) {
        if (armyAmount <= 0) return interaction.editReply('You cannot simulate sending 0 or negative soldiers.');
        if (armyAmount > attacker.army) return interaction.editReply(`Attacker only has ${attacker.army} army! You cannot simulate sending ${armyAmount}.`);
    }

    // UPDATED: Pass armyAmount to the calculation
    const attackerWinChance = Country.calculateWinChance(attacker, defender, armyAmount);

    // Convert decimal (0.75) to percentage (75.0)
    const attackerWinPercent = (attackerWinChance * 100).toFixed(1);
    const defenderWinPercent = ((1 - attackerWinChance) * 100).toFixed(1);

    // UPDATED: Get the score based on the simulated army size
    // If armyAmount is null, it defaults to full army.
    const attackerScore = attacker.getWarScore(armyAmount); 
    const defenderScore = defender.getWarScore(); // Defender always defends with everything

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
            `**${attacker.country} ${attacker.flag}** vs **${defender.country} ${defender.flag}**\n` +
            `*(Simulating with: ${armyAmount ? armyAmount : 'Full Army'})*\n\n` +
            `📊 **Attacker Score:** ${attackerScore}\n` +
            `🛡️ **Defender Score:** ${defenderScore}\n` +
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
        )
        // army amnt
        .addIntegerOption(option => 
            option.setName('army').setDescription('How much army to simulate sending (Default: All).').setRequired(false)
        );
};
