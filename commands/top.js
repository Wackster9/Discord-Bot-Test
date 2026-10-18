const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');
	const subcommand = interaction.options.getSubcommand();
	const embed = new djs.EmbedBuilder().setColor(settings.color);
	let description = '';
	let sorted = game.countries.slice();

	switch (subcommand) {
		case 'military_power':
			sorted.sort((a, b) => (b.army + Math.floor(b.army * (b.tank / 50))) - (a.army + Math.floor(a.army * (a.tank / 50))));
			break;
		case 'industry':
			sorted.sort((a, b) => b.industry - a.industry);
			break;
		case 'army':
			sorted.sort((a, b) => b.army - a.army);
			break;
		case 'tank':
			sorted.sort((a, b) => b.tank - a.tank);
			break;
		case 'money':
			sorted.sort((a, b) => b.money - a.money);
			break;
	}
	sorted = sorted.slice(0, settings.topCountriesNumber);
	for (let i = 0; i < sorted.length; i++) {
		const country = sorted[i];
		switch (subcommand) {
			case 'industry':
				description += `${i + 1}. ${country.country}  ${country.flag}  ${country.pid ? `<@${country.pid}> ` : ''}-  ${
					country.industry
				} industry\n`;
				break;
			case 'military_power':
				description += `${i + 1}. ${country.country}  ${country.flag}  ${country.pid ? `<@${country.pid}> ` : ''}-  ${
					country.army + Math.floor(country.army * (country.tank / 50))
				} War Score ( ${
					country.army
				} army, ${
					country.tank
				} tanks)\n`;
				break;
			case 'army':
				description += `${i + 1}. ${country.country}  ${country.flag}  ${country.pid ? `<@${country.pid}> ` : ''}-  ${
					country.army
				} army, ${
					country.tank
				} tanks\n`;
				break;
			case 'tank':
				description += `${i + 1}. ${country.country}  ${country.flag}  ${country.pid ? `<@${country.pid}> ` : ''}-  ${
					country.tank
				} tanks\n`;
				break;
			case 'money':
				description += `${i + 1}. ${country.country}  ${country.flag}  ${country.pid ? `<@${country.pid}> ` : ''}-  ${
					country.money
				} money\n`;
				break;
		}
	}
	embed
		.setTitle(`Top ${subcommand}`)
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() });
	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => {};
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('top')
		.setDescription('View the top countries in different categories.')
		.addSubcommand(subcommand => subcommand.setName('industry').setDescription('View the countries with the highest industry.'))
		.addSubcommand(subcommand => subcommand.setName('army').setDescription('View the countries with the biggest army.'))
		.addSubcommand(subcommand => subcommand.setName('tank').setDescription('View the countries with the most tanks.'))
		.addSubcommand(subcommand => subcommand.setName('money').setDescription('View the countries with the most money.'))
		.addSubcommand(subcommand => subcommand.setName('military_power').setDescription('View the countries with the strongest army.'));
};