const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply();

    if (!game.started) return interaction.editReply('The game has not started yet.');

    const guildId = interaction.guildId;
    const gameStart = interaction.client.gameStart[guildId];
    const minutesPerMonth = interaction.client.minutesPerMonth[guildId];

    if (!gameStart || !minutesPerMonth)
        return interaction.editReply('Could not determine game time settings.');

    const msPerMonth = Number(minutesPerMonth) * 60 * 1000;
    const msPassed = Date.now() - Number(gameStart);
    const monthsPassed = Math.floor(msPassed / msPerMonth);
    const currentMonthIndex = monthsPassed % 12;

    const nextPaycheckMonth = [0, 4, 8].find(month => month > currentMonthIndex);

    const monthsUntilPaycheck = nextPaycheckMonth !== undefined
        ? nextPaycheckMonth - currentMonthIndex
        : 12 - currentMonthIndex;

    const nextPaycheckTime = Number(gameStart) + (monthsPassed + monthsUntilPaycheck) * msPerMonth;

    const embed = new djs.EmbedBuilder()
        .setTitle('Time left')
        .setTimestamp()
        .setColor(settings.color)
        .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
        .setDescription(`Time left until the next paycheck: <t:${Math.floor(nextPaycheckTime / 1000)}:R>`);

    await interaction.editReply({ embeds: [embed] });
};

module.exports.button = async interaction => { };

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder().setName('money-cooldown').setDescription('Shows how much is left until the next paycheck.');
};
