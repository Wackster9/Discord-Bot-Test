const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const country = game.getCountry(interaction.options.getString('country'));
	if (!country) return interaction.editReply('Country not found.');
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
		.setName('country-stats')
		.setDescription("Check a country's information.")
		.addStringOption(option =>
			option.setName('country').setDescription('The name or number of the country you want to view.').setRequired(true),
		);
};
