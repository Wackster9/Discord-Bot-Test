const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	const donor = interaction.options.getString('country');
	const recipient = interaction.options.getString('country_2')
	const industry = interaction.options.getNumber('industry_percentage');
	const money = interaction.options.getNumber('money_percentage');
	const army = interaction.options.getNumber('army_percentage');
	const tank = interaction.options.getNumber('tank_percentage');
	const wipe = interaction.options.getString('remove_donor_stats');
	const wipeStats = wipe === "true";
	const country = game.getCountry(donor);
	if (!country) return interaction.editReply('Invalid donor');
	const country2 = game.getCountry(recipient);
	if (!country2) return interaction.editReply('Invalid recipient');

	country2.industry += Math.round(country.industry * (industry / 100));
	country.industry -= Math.round(country.industry * (industry / 100));

	country2.money += Math.round(country.money * (money / 100));
	country.money -= Math.round(country.money * (money / 100));

	country2.army += Math.round(country.army * (army / 100));
	country.army -= Math.round(country.army * (army / 100));

	country2.tank += Math.round(country.tank * (tank / 100));
	country.tank -= Math.round(country.tank * (tank / 100));

	if (wipeStats) {
		country.tank -= country.tank;
		country.industry -= country.industry;
		country.money -= country.money;
		country.army -= country.army;
	}
	
	country.distributeToFronts(game);
	country2.distributeToFronts(game);

	let easter;
	
	if (Math.random() > .9) //haha funny
		easter = 'You\'re a fraud Doctor. You don\'t have a doctorate. Screw you.'
	else if (Math.random() > .9)
		easter = 'Otto makes for a very good ottoman. Don\'t tell him i said that though.'
	else if (Math.random() > .9)
		easter = 'You really hate ' + donor + ' this much? You must be a weirdo to hate ' + donor + '. Everyone loves ' + donor + '!'
	else easter = ' '

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Modified by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country.country} ${country.flag}`)
		.setDescription(easter)
		.addFields(
			{ name: 'Industry', value: `${country.industry}`, inline: true },
			{ name: 'Army', value: `${country.army}`, inline: true },
			{ name: 'Tanks', value: `${country.tank}`, inline: true },
			{ name: 'War Score', value: `${country.army + Math.floor(country.army * (country.tank / 50))}`, inline: true },
			{ name: 'Money', value: `${Math.floor(country.money)}`, inline: true },
			{ name: 'Type', value: `${country.type.slice(0, -1)}`, inline: true },
		);
	if (Math.random() > .9) //haha funny
		easter = 'ULTIMATUM'
	else if (Math.random() > .9)
		easter = 'You really want to make ' + recipient + ' this strong? You must be some sort of ' + recipient + 'aboo.'
    else if (math.random() > .9)
        easter = 'Update is EVIL'
	else easter = ' '

	const embed2 = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Modified by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country2.country} ${country2.flag}`)
		.setDescription(easter)
		.addFields(
			{ name: 'Industry', value: `${country2.industry}`, inline: true },
			{ name: 'Army', value: `${country2.army}`, inline: true },
			{ name: 'Tanks', value: `${country2.tank}`, inline: true },
			{ name: 'War Score', value: `${country2.army + Math.floor(country2.army * (country2.tank / 50))}`, inline: true },
			{ name: 'Money', value: `${Math.floor(country2.money)}`, inline: true },
			{ name: 'Type', value: `${country2.type.slice(0, -1)}`, inline: true },
		);

	await interaction.editReply({
		embeds: [embed, embed2]
	});
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('transfer')
		.setDescription("Give one country's stats to another")
		.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
		.addStringOption(option =>
			option
				.setName('country')
				.setDescription('Name of the country giving stats')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('country_2')
				.setDescription('Name of the country receiving stats')
				.setRequired(true)
		)
		.addNumberOption(option =>
			option
				.setName('industry_percentage')
				.setDescription('Percentage (0-100) of industry to give to other nation')
				.setRequired(true),
		)
		.addNumberOption(option =>
			option
				.setName('money_percentage')
				.setDescription('Percentage (0-100) of money to give to other nation')
				.setRequired(true),
		)
		.addNumberOption(option =>
			option
				.setName('army_percentage')
				.setDescription('Percentage (0-100) of army to give to other nation')
				.setRequired(true),
		)
		.addNumberOption(option =>
			option
				.setName('tank_percentage')
				.setDescription('Percentage (0-100) of tanks to give to other nation')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('remove_donor_stats')
				.setDescription('do you want to wipe the other country\'s stats and delete it ()')
				.addChoices(
					{ name: 'yes', value: 'true' },
					{ name: 'no', value: 'idiotsandwich' },
				)
				.setRequired(true),
		)
};
