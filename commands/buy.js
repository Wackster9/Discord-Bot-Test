const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const subcommand = interaction.options.getSubcommand();
	let amount = interaction.options.getInteger('amount');
	const country = game.getPlayer(interaction.user.id);
	if (!game.started) return interaction.editReply('Quit being a quickshot there aint no game yet.');
	if (!country) return interaction.editReply('You are not Jeffrey Bezos, claim a country to buy something.');
	if (!country.active) return interaction.editReply('*moons you*');
	if (amount < 1) return interaction.editReply('Ghostbuying before GTA 6');
	let cost = 0;
	let resource = '';

	switch (subcommand) {
		case 'industry':
			cost = amount * settings.industryCost;
			resource = 'industry';
			amount *= 20;
			break;
		case 'army':
			cost = amount * settings.armyCost;
			resource = 'army';
			break;
		case 'tank':
			cost = amount * interaction.client.tankCost[interaction.guild.id];
			resource = 'tank';
			break;
	}
	if (country.money < cost)
		return interaction.editReply(`You do not have enough money. You need $${cost} and you only have $${country.money}.`);
	country[resource] += amount;
	country.money -= cost;
	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country.country} ${country.flag}`)
		.setDescription(`You have bought ${amount} ${resource == 'tank' ? 'tanks' : resource} for $${cost}.`)
		.addFields(
			{ name: 'Industry', value: `${country.industry}`, inline: true },
			{ name: 'Army', value: `${country.army}`, inline: true },
			{ name: 'Tanks', value: `${country.tank}`, inline: true },
			{ name: 'War Score', value: `${country.army + Math.floor(country.army * (country.tank / 50))}`, inline: true },
			{ name: 'Money', value: `${Math.floor(country.money)}`, inline: true },
			{ name: 'Type', value: `${country.type.slice(0, -1)}`, inline: true },
		);
	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('buy')
		.setDescription('Buy a resource with money.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('industry')
				.setDescription('Buy industry with money. (1=20 industry for 10 money.)')
				.addIntegerOption(option => option.setName('amount').setDescription('The amount of industry to buy.').setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('army')
				.setDescription('Buy army with money.')
				.addIntegerOption(option => option.setName('amount').setDescription('The amount of army to buy.').setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tank')
				.setDescription('Buy tanks with money.')
				.addIntegerOption(option => option.setName('amount').setDescription('The amount of tanks to buy.').setRequired(true)),
		);
};
