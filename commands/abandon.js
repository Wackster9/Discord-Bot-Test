const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	if (!game.started) return interaction.editReply('The game has not started yet.');
	const country = game.getPlayer(interaction.user.id);
	if (!country) return interaction.editReply('You have not claimed a country yet.');
	if (!country.active) return interaction.editReply('Your country is already inactive.');
	game.abandonCountry(interaction.user.id);

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country.country} ${country.flag}`)
		.setDescription(`You have abandoned your country.`);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => {};
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder().setName('abandon').setDescription('Abandon your country.');
};
