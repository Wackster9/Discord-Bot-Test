const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country, Front, client) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	const name = interaction.options.getString('name');
	const index = game.fronts.findIndex(front => front.name.toLowerCase() === name.toLowerCase());
	if (index != -1) {
		Object.entries(game.fronts[index].attackerArmies).forEach(([country, army]) => {
			game.getCountry(country).assignedArmy -= army;
		});
		Object.entries(game.fronts[index].defenderArmies).forEach(([country, army]) => {
			game.getCountry(country).assignedArmy -= army;
		});
		Object.entries(game.fronts[index].attackerTanks).forEach(([country, tank]) => {
			game.getCountry(country).assignedTanks -= tank;
		});
		Object.entries(game.fronts[index].defenderTanks).forEach(([country, tank]) => {
			game.getCountry(country).assignedTanks -= tank;
		});
		game.fronts.splice(index, 1);
	}
	else return interaction.editReply('That front doesn\'t exist.')


	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Deleted by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${name}`)
		.setDescription(`You have deleted ${name} from existence.`);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return (
		new djs.SlashCommandBuilder()
			.setName('delete-front')
			.setDescription('Remove a front from the game')
			.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
			.addStringOption(option => option.setName('name').setDescription('the front').setRequired(true))
	);
};
