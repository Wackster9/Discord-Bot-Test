const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country, Front, client) => {
	await interaction.deferReply();
	const p = game.getPlayer(interaction.user.id);
	if (!game.started) return interaction.editReply('The game hasn\'t started yet.');
	if (p == null) return interaction.editReply('You haven\'t claimed a country.')

	const name = interaction.options.getString('front');
	const recipient = interaction.options.getString('recipient');
	const f = game.fronts.find(front => front.name === name);
	if (f == null)
		return interaction.editReply('That front doesn\'t exist.');
	if (p.country === f.atkleader.country) {
		if (f.attackers.find(recip => recip.country === recipient) == null)
			return interaction.editReply('The recipient either isn\'t on your side or is not on the front.');
		f.atkleader = game.getCountry(recipient);
	}
	else if (p.country === f.defleader.country) {
		if (f.defenders.find(recip => recip.country === recipient) == null)
			return interaction.editReply('The recipient either isn\'t on your side or is not on the front.');
		f.defleader = game.getCountry(recipient);
	}
	else
		return interaction.editReply('You are not the attack leader or defense leader for this front.')

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Ran by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${f.name}`)
		.setDescription(`${p.country} has given war leader to ${recipient}.`);
	await interaction.editReply({ embeds: [embed] });
}
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return (
		new djs.SlashCommandBuilder()
			.setName('give-war-leader')
			.setDescription('Give war leader to another player on your side of the front.')
			.addStringOption(option => option.setName('front').setDescription('the front you want to give it up on').setRequired(true))
			.addStringOption(option => option.setName('recipient').setDescription('the nation you want to give it to').setRequired(true))
	);
};