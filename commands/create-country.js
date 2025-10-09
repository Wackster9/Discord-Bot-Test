const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	const name = interaction.options.getString('country');
	const industry = interaction.options.getInteger('industry');
	const army = interaction.options.getInteger('army');
	const tanks = interaction.options.getInteger('tanks');
	const money = interaction.options.getInteger('money');
	//const type = interaction.options.getString('type');
	const flag = interaction.options.getString('flag');

	const country = new Country(name, industry, army, tanks, money, `Manually Created`, flag);
	game.countries.push(country);

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Created by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country.country} ${country.flag}`)
		.setDescription(`You have committed an act of god.`);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => {};
module.exports.application_command = () => {
	return (
		new djs.SlashCommandBuilder()
			.setName('create-country')
			.setDescription('Add a new country to the game')
			.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
			.addStringOption(option => option.setName('country').setDescription('do not type türkiye').setRequired(true))
			.addStringOption(option => option.setName('flag').setDescription('Thoust banner').setRequired(true))
			.addStringOption(option => option.setName('type').setDescription('The rank of the country (minor, medium, etc)').setRequired(true))
			// .addStringOption(option =>
			// 	option
			// 		.setName('type')
			// 		.setDescription('The type this country is classified as')
			// 		.setRequired(true)
			// 		.addChoices(
			// 			{ name: 'Major Powers', value: 'Major Powers' },
			// 			{ name: 'Minor Powers', value: 'Minor Powers' },
			// 			{ name: 'Microstates', value: 'Microstates' },
			// 		),
			// )
			.addIntegerOption(option => option.setName('industry').setDescription('How much industry the country has').setRequired(true))
			.addIntegerOption(option => option.setName('money').setDescription('How much money the country has').setRequired(true))
			.addIntegerOption(option => option.setName('army').setDescription('How much army the country has').setRequired(true))
			.addIntegerOption(option => option.setName('tanks').setDescription('How many tanks the country has').setRequired(true))
	);
};
