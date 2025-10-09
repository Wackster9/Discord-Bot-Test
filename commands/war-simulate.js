const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply();

    const attackerCountry = interaction.options.getString('attacker');
    const defenderCountry = interaction.options.getString('defender');

    const attacker = game.getCountry(attackerCountry);
    const defender = game.getCountry(defenderCountry);

    if (!game.started) return interaction.editReply('No game has started yet.');
    if (!attacker) return interaction.editReply('Invalid attacking country specified.');
    if (!defender) return interaction.editReply('Invalid defending country specified.');
    if (attacker.country === defender.country) return interaction.editReply('That’s the same country.');

    // Compute scores
    const attackerScore = attacker.getWarScore();
    const defenderScore = Math.round(defender.getWarScore() * 1.1); // nerfed from 20% to 10%
    const totalScore = attackerScore + defenderScore;

    // Base chance is proportional to scores
    let attackerWinChance = attackerScore / totalScore;

    // Apply flat odds buffs/nerfs (same logic as getWarResult)
    if (attackerScore / defenderScore > 1.1) {
        attackerWinChance += 0.10;
    } else if (attackerScore / defenderScore > 1.0) {
        attackerWinChance += 0.05;
    } else if (defenderScore / attackerScore > 1.1) {
        attackerWinChance -= 0.10;
    } else if (defenderScore / attackerScore > 1.0) {
        attackerWinChance -= 0.05;
    }

    // Clamp between 0 and 1
    attackerWinChance = Math.max(0, Math.min(1, attackerWinChance));

    const attackerWinPercent = (attackerWinChance * 100).toFixed(1);
    const defenderWinPercent = (100 - attackerWinPercent).toFixed(1);

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
            `📊 **Attacker Score:** ${attackerScore}\n` +
            `🛡️ **Defender Score:** ${defenderScore}\n` +
            `\n🎲 **Win Odds:**\n` +
            `- ${attacker.country}: **${attackerWinPercent}%**\n` +
            `- ${defender.country}: **${defenderWinPercent}%**\n`
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
