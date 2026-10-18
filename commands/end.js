const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	game.end();

	await interaction.editReply('The game has ended. Thank you for playing!');
};
module.exports.button = async interaction => {};
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('end')
		.setDescription('Ends the game')
		.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator);
};
