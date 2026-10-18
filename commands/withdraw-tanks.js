const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    let amount = interaction.options.getInteger('amount');
    const country = game.getPlayer(interaction.user.id);
    const front = game.getFront(interaction.options.getString('front'));
    let side = -1;

    if (!game.started) return interaction.editReply('The game has not started yet.');
    if (!front) return interaction.editReply('That front does not exist.');
    if (!country) return interaction.editReply('You have not claimed a country yet.');
    if (amount < 1) return interaction.editReply('You must remove at least 1 tank.');

    if (front.attackers.find(a => a.country === country.country)) {
        side = 'attacker';
        if (front.attackerTanks[country.country] < amount)
            amount = front.attackerTanks[country.country];
    }
    if (front.defenders.find(a => a.country === country.country)) {
        side = 'defender';
        if (front.defenderTanks[country.country] < amount)
            amount = front.defenderTanks[country.country];
    }
    if (side == -1)
        return interaction.editReply('You are not a part of this front.')

    country.assignedTanks -= amount;
    if (side == 'attacker')
        front.attackerTanks[country.country] = (front.attackerTanks[country.country] || 0) - amount;
    else
        front.defenderTanks[country.country] = (front.defenderTanks[country.country] || 0) - amount;

    const embed = new djs.EmbedBuilder()
        .setTimestamp()
        .setColor(settings.color)
        .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
        .setTitle(`${country.country} ${country.flag}`)
        .setDescription(`You have taken back ${amount} tanks from the ${front.name}.`)
        .addFields(
            { name: 'Assigned Tanks', value: `${Math.floor(country.assignedTanks)}`, inline: true },
            // { name: 'Front Tanks', value: `${Math.floor()}`, inline: true },
        );

    await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('withdraw-tanks')
        .setDescription('Remove tanks from a front.')
        .addStringOption(option => option.setName('front').setDescription('The front you are removing tanks from.').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of tanks you want back (more than you sent will withdraw all).').setRequired(true));
};
