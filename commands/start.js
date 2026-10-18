const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();

	const countriesFile = interaction.options.getString('countries-file');
	const tankCost = interaction.options.getNumber('tank-cost');
	const tankUpkeep = interaction.options.getNumber('tank-upkeep');
	const armyUpkeep = interaction.options.getNumber('army-upkeep');
	const minutesPerMonth = interaction.options.getNumber('minutes-per-month') || settings.minutesPerMonth;
	const validMinutes = [0.5, 15, 30, 45, 60, 90, 120, 150, 180, 240];
	if (!countriesFile.endsWith('.js')) return interaction.editReply('Invalid file format.');
	if (game.started) return interaction.editReply('The game has already started.');
	game.start(countriesFile);
	if (!validMinutes.includes(minutesPerMonth)) {
		return interaction.editReply('The amount of minutes needs to be one of the options: (15, 30, 45, 60, 90, 120, 150, 180, or 240).');
	}
	interaction.client.gameStart[interaction.guild.id] = Date.now();
	interaction.client.yearStart[interaction.guild.id] = countriesFile.split('-')[1].split('.')[0];
	interaction.client.tankCost[interaction.guild.id] = tankCost;
	interaction.client.tankUpkeep[interaction.guild.id] = tankUpkeep;
	interaction.client.armyUpkeep[interaction.guild.id] = armyUpkeep;
	interaction.client.minutesPerMonth[interaction.guild.id] = minutesPerMonth;

	const embed = new djs.EmbedBuilder().setColor(settings.color);
	let description = '';
	for (let i = 0; i < game.countries.length; i++) {
		const country = game.countries[i];
		if (country.type !== game.countries[i - 1]?.type) description += `\n**${country.type}**\n`;
		description += `${i + 1}. ${country.country} ${country.flag}${country.pid ? ` <@${country.pid}>` : ''}${country.active ? '' : ' (abandoned)'
			}\n`;
	}
	const splitted = description.match(/[\s\S]{1,3800}(?=\n|$)/g);
	for (let i = 0; i < splitted.length; i++) {
		const split = splitted[i];
		switch (i) {
			case 0:
				embed.setTitle('Countries').setDescription(split);
				await interaction.editReply({ content: `The game has started, have fun!`, embeds: [embed] });
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
		.setName('start')
		.setDescription('Starts a new game.')
		.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
		.addStringOption(option => option.setName('countries-file').setDescription('What file to be used in the game.').setRequired(true))
		.addNumberOption(option => option.setName('tank-cost').setDescription('The cost of a tank.').setRequired(true))
		.addNumberOption(option => option.setName('tank-upkeep').setDescription('The paycheck upkeep of a tank.').setRequired(true))
		.addNumberOption(option => option.setName('army-upkeep').setDescription('The paycheck upkeep of an army.').setRequired(true))
		.addNumberOption(option => option.setName('minutes-per-month').setDescription('The minutes in 1 month. ex: 15, 30, 45, 60, 90, 120, 150, 180, 240. Default = 120.').setRequired(false));
};