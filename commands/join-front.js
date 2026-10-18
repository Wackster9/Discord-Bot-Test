const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country, Front, client) => {
	await interaction.deferReply();
	const p = game.getPlayer(interaction.user.id);
	if (!game.started) return interaction.editReply('The game hasn\'t started yet.');
	if (p == null)
		return interaction.editReply('You haven\'t claimed a country.');
	const name = interaction.options.getString('name');
	const side = interaction.options.getString('side');
	const f = game.fronts.find(front => front.name === name);
	if (f == null)
		return interaction.editReply('That front doesn\'t exist.');
	if (f.attackers.find(country => country.country === p.country) || f.defenders.find(country => country.country === p.country))
		return interaction.editReply('You already are in this front.')
	f[side].push(game.getCountry(p.country))

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Ran by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${f.name}`)
		.setDescription(`${p.country} has joined the ${f.name}.`);
	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return (
		new djs.SlashCommandBuilder()
			.setName('join-front')
			.setDescription('Join a side in a front (make sure a mod is present if you\'re newer)')
			.addStringOption(option => option.setName('name').setDescription('do not type türkiye').setRequired(true))
			.addStringOption(option => option.setName('side').setDescription('the side you seek to join').setRequired(true)
				.addChoices(
					{ name: 'attackers', value: 'attackers' },
					{ name: 'defenders', value: 'defenders' },
				))
	);
};