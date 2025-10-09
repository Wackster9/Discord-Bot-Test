const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	if (game.getPlayer(interaction.user.id) && game.getPlayer(interaction.user.id).active) {
		return interaction.editReply('You have already claimed a country.');
	}

	const country = interaction.options.getString('country');
	const c = game.getCountry(country);
	if (c.pid) {
		return interaction.editReply('This country is already claimed.');
	}

	game.assignCountry(interaction.user.id, c.country);
	await interaction.editReply(`You have claimed the ${c.country} ${c.flag}.`);
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('claim')
		.setDescription('Claim an available country.')
		.addStringOption(option =>
			option.setName('country').setDescription('The name or number of the country you want to claim.').setRequired(true),
		);
};
