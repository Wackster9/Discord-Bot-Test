const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const country = game.getPlayer(interaction.user.id);
    const front = game.getFront(interaction.options.getString('front'));
    let side = -1;

    if (!game.started) return interaction.editReply('The game has not started yet.');
    if (!front) return interaction.editReply('That front does not exist.');
    if (!country) return interaction.editReply('You have not claimed a country yet.');
    if (amount < 1) return interaction.editReply('You must send at least 1 tank.');
    if (country.tank < amount) return interaction.editReply('You do not have enough tanks.');
    if (country.tank < amount + country.assignedTanks) return interaction.editReply('You do not have enough unallocated tanks to do that. Available tanks: ' + country.tank - country.assignedTanks);

    if (front.attackers.find(a => a.country === country.country))
        side = 'attacker';
    if (front.defenders.find(a => a.country === country.country))
        side = 'defender';
    if (side == -1)
        return interaction.editReply('You are not a part of this front.')

    country.assignedTanks += amount;
    if (side == 'attacker')
        front.attackerTanks[country.country] = (front.attackerTanks[country.country] || 0) + amount;
    else
        front.defenderTanks[country.country] = (front.defenderTanks[country.country] || 0) + amount;

    const embed = new djs.EmbedBuilder()
        .setTimestamp()
        .setColor(settings.color)
        .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
        .setTitle(`${country.country} ${country.flag}`)
        .setDescription(`You have sent ${amount} tanks to the ${front.name}.`)
        .addFields(
            { name: 'Assigned Tanks', value: `${Math.floor(country.assignedTanks)}`, inline: true },
            // { name: 'Front Tanks', value: `${Math.floor()}`, inline: true },
        );

    await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('add-tanks')
        .setDescription('Send tanks to a front.')
        .addStringOption(option => option.setName('front').setDescription('The front you are assigning tanks to.').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of tanks you want to send.').setRequired(true));
};
