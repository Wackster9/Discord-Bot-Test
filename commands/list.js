const djs = require('discord.js');
const settings = require('../settings.json');
const path = require('path');

module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();

	const listChoice = interaction.options.getString('list_name');
	let countriesData;
	let usingGameList = false;

	if (listChoice) {
		// Load from specified file
		try {
			countriesData = require(path.join(__dirname, `../countries/${listChoice}`)).countries;
		} catch (err) {
			return interaction.editReply(`❌ Could not load list: ${listChoice}.`);
		}
	} else {
		// No list specified
		if (game.started) {
			countriesData = game.countries.map(c => [
				c.country,
				c.industry,
				c.army,
				c.tank,
				c.money,
				c.type,
				c.flag
			]);
			usingGameList = true;
		} else {
			countriesData = require(path.join(__dirname, '../countries/countries-1933.js')).countries;
		}
	}

	let players = usingGameList ? game.countries.filter(c => c.pid && c.active).length : 0;
	const embed = new djs.EmbedBuilder().setColor(settings.color);
	let description = '';

	const typeOrder = {
		"Superpowers": 1,
		"Major Powers": 2,
		"Regional Powers": 3,
		"Medium Powers": 4,
		"Minor Powers": 5,
		"Small Powers": 6,
		"Insignificant Powers": 7,
		"Irrelevant Powers": 8,
		"Minor Insignificant Powers": 9,
		"Very Minor Insignificant Powers": 10,
		"Microstates": 11
	};

	countriesData.sort((a, b) => typeOrder[a[5]] - typeOrder[b[5]]);

	for (let i = 0; i < countriesData.length; i++) {
		const country = countriesData[i];
		if (country[5] !== countriesData[i - 1]?.[5])
			description += `\n**${country[5]}**\n\n`;
		description += `${i + 1}. ${country[0]} ${country[6] || '🏳️'}`;
		if (usingGameList) {
			const countryObj = game.getCountry(country[0]);
			if (countryObj?.pid) description += ` <@${countryObj.pid}>`;
		}
		description += `\n`;
	}

	const splitted = description.match(/[\s\S]{1,3800}(?=\n|$)/g);
	for (let i = 0; i < splitted.length; i++) {
		const split = splitted[i];
		switch (i) {
			case 0:
				embed.setTitle('Countries').setDescription(
					usingGameList ? `There are currently ${players} players in the game.\n\n${split}` : split
				);
				await interaction.editReply({ embeds: [embed] });
				embed.setTitle(null);
				break;
			case splitted.length - 1:
				embed
					.setDescription(split)
					.setTimestamp()
					.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() });
				await interaction.followUp({ embeds: [embed] });
				break;
			default:
				embed.setDescription(split);
				await interaction.followUp({ embeds: [embed] });
		}
	}
};

module.exports.button = async interaction => { };

module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('list')
		.setDescription('Lists all countries from a specific date, or current game if no era is chosen.')
		.addStringOption(opt =>
			opt.setName('list_name')
				.setDescription('The date to view (leave empty for current game)')
				.setRequired(false)
				.addChoices(
					{ name: '1848', value: 'countries-1848.js' },
					{ name: '1910', value: 'countries-1910.js' },
					{ name: '1919', value: 'countries-1919.js' },
					{ name: '1933', value: 'countries-1933.js' },
					{ name: '1936', value: 'countries-1936.js' },
					{ name: '1947', value: 'countries-1947.js' },
					{ name: '1962', value: 'countries-1962.js' },
					{ name: '1985', value: 'countries-1985.js' },
					{ name: '2013', value: 'countries-2013.js' },
					{ name: '2020', value: 'countries-2020.js' }
				)
		);
};
