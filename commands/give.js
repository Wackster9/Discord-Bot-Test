const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	const name = interaction.options.getString('country');
	const resource = interaction.options.getString('resource');
	const amount = interaction.options.getNumber('amount');
	const country = game.getCountry(name);
	if (!country) return interaction.editReply('Invalid country');
	country[resource] += amount;
	if(resource=="army"||resource=="tank") {
		country.distributeToFronts(game);
	}

	const embed = new djs.EmbedBuilder()
		.setTitle(`${country.country} ${country.flag}`)
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.addFields(
			{ name: 'Industry', value: `${country.industry}`, inline: true },
			{ name: 'Army', value: `${country.army}`, inline: true },
			{ name: 'Tanks', value: `${country.tank}`, inline: true },
			{ name: 'Money', value: `${Math.floor(country.money)}`, inline: true },
			{ name: 'Unallocated Army', value: `${country.army - country.assignedArmy}`, inline: true },
			{ name: 'Unallocated Tanks', value: `${country.tank - country.assignedTanks}`, inline: true },
			{ name: 'War Score', value: `${country.army + Math.floor(country.army * (country.tank / 50))}`, inline: true },
			{ name: 'Type', value: `${country.type.slice(0, -1)}`, inline: true },
			{ name: 'HP', value: `${country.hp}`, inline: true },
		);
	if (country.pid && country.active) embed.setDescription(`Claimed by <@${country.pid}>`);
	else if (!country.active) embed.setDescription(`This country is inactive. Claimed by <@${country.pid}>`);
	else embed.setDescription('This country is unclaimed.');
	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('give')
		.setDescription("Modify a country's resources")
		.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
		.addStringOption(option => option.setName('country').setDescription('The name or number of the country').setRequired(true))
		.addStringOption(option =>
			option
				.setName('resource')
				.setDescription('The resource to modify')
				.setRequired(true)
				.addChoices(
					{ name: 'Industry', value: 'industry' },
					{ name: 'Army', value: 'army' },
					{ name: 'Tanks', value: 'tank' },
					{ name: 'Money', value: 'money' },
				),
		)
		.addNumberOption(option => option.setName('amount').setDescription('The amount to give (can be negative)').setRequired(true));
};
