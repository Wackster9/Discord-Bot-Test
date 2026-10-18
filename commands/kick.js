const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	if (!game.started) return interaction.editReply('The game has not started yet.');
	const country = game.getCountry(interaction.options.getString('country'));
	if (!country) return interaction.editReply('Country not found.');
	if (!country.pid) return interaction.editReply('This country is not owned by a player.');
	if (!country.active) return interaction.editReply('Player country is already inactive.');
	game.abandonCountry(country.pid);

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Kicked by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country.country} ${country.flag}`)
		.setDescription(`This country has been abandoned. It is now unclaimable and uninteractable for the rest of the game.`);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => {};
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('kick')
		.setDescription('Force a player to abandon their country')
		.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
		.addStringOption(option =>
			option.setName('country').setDescription('The name or number of the country you want to kick.').setRequired(true),
		);
};
