const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {

	await interaction.deferReply();

	const target = interaction.options.getString('target');
	const c = game.getCountry(target);
	const front = game.getFront(interaction.options.getString('front'));
	const attacker = interaction.options.getString('attacker');
	const a = game.getCountry(attacker);

	if (!game.started)
		return interaction.editReply('Quit being a quickshot there aint no game yet.');
	if (!a)
		return interaction.editReply('You haven\'t claimed a country.');
	if (!c)
		return interaction.editReply('That country does not exist.');
	if (!front)
		return interaction.editReply('That front does not exist.');
	if (a !== front.atkleader && a !== front.defleader)
		return interaction.editReply('Attacking country isn\'t a war leader');

	const result = front.getBattleResult(attacker, target);

	if (!result) {
		return interaction.editReply(
			'Those countries are not on opposing sides of this front.'
		);
	}

	const winnerMention = result.winner.pid
		? `<@${result.winner.pid}>`
		: ''; //if unclaimed

	const loserMention = result.loser.pid
		? `<@${result.loser.pid}>`
		: ''; //if unclaimed

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({
			text: `War started by ${interaction.member.displayName}`,
			iconURL: interaction.member.displayAvatarURL()
		})
		.setTitle('Battle Overview')
		.setDescription(
			`${result.winner.country} ${result.winner.flag} ${winnerMention} ` +
			`has defeated ${result.loser.country} ${result.loser.flag} ` +
			`${loserMention} and won the battle.\n\n` +

			`**Win Chance:** ${result.winChance}%\n\n` +

			`${result.attacker.country} ${result.attacker.flag} ` +
			`lost **${result.atkLoses} army**.\n` +

			`${result.defender.country} ${result.defender.flag} ` +
			`lost **${result.defLoses} army**.`
		);

	await interaction.editReply({
		embeds: [embed]
	});
};

module.exports.button = async interaction => { };

module.exports.application_command = () => {

	return new djs.SlashCommandBuilder()
		.setName('forcewar')
		.setDescription('Start a battle on a front.')
		.setDefaultMemberPermissions((djs.PermissionsBitField.Flags.Administrator))
		.addStringOption(option =>
			option
				.setName('front')
				.setDescription('The front you want to attack on')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('attacker')
				.setDescription('the attaacking country')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('target')
				.setDescription('The country you want to attack')
				.setRequired(true)
		);

};