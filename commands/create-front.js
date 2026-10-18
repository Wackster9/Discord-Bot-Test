const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game, Country, Front, client) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	const name = interaction.options.getString('name');
	const attackers = []; //declare each as an empty array then we push after 
	const defenders = [];
	//lets just do 5 spots, any more you have to use a command, sorry not sorry
	const attacker1 = game.getCountry(interaction.options.getString('attacker1'));
	if (!attacker1) return interaction.editReply('Attacker 1 not found!');
	attackers.push(attacker1);

	const defender1 = game.getCountry(interaction.options.getString('defender1'));
	if (!defender1) return interaction.editReply('Defender 1 not found!');
	defenders.push(defender1);

	const attacker2 = game.getCountry(interaction.options.getString('attacker2'));
	if (!(attacker2 == null))
		attackers.push(attacker2);

	const attacker3 = game.getCountry(interaction.options.getString('attacker3'));
	if (!(attacker3 == null))
		attackers.push(attacker3);

	const attacker4 = game.getCountry(interaction.options.getString('attacker4'));
	if (!(attacker4 == null))
		attackers.push(attacker4);

	const attacker5 = game.getCountry(interaction.options.getString('attacker5'));
	if (!(attacker5 == null))
		attackers.push(attacker5);

	const defender2 = game.getCountry(interaction.options.getString('defender2'));
	if (!(defender2 == null))
		defenders.push(defender2);

	const defender3 = game.getCountry(interaction.options.getString('defender3'));
	if (!(defender3 == null))
		defenders.push(defender3);

	const defender4 = game.getCountry(interaction.options.getString('defender4'));
	if (!(defender4 == null))
		defenders.push(defender4);

	const defender5 = game.getCountry(interaction.options.getString('defender5'));
	if (!(defender5 == null))
		defenders.push(defender5);

	const atkleader = game.getCountry(interaction.options.getString('attackleader'));
	const defleader = game.getCountry(interaction.options.getString('defendleader'));

	if (attackers.length != new Set(attackers).size)
		return interaction.editReply('You cannot have the same country twice on the attacking side.')
	if (defenders.length != new Set(defenders).size)
		return interaction.editReply('You cannot have the same country twice on the defending side.')
	if (attackers.some(c => defenders.includes(c)))
		return interaction.editReply('You cannot have the same country on the attacking and defending side.')

	const front = new Front(game, name, attackers, defenders, atkleader, defleader);

	game.fronts.push(front);

	front.attackers.forEach(country => {
		if (country.pid == '') {
			console.log('AI nation ' + country.country + 'detected in Attackers.')
			country.distributeToFronts(game);
		}
	});

	front.defenders.forEach(country => {
		if (country.pid == '') {
			console.log('AI nation ' + country.country + 'detected in Defenders.')
			country.distributeToFronts(game);
		}
	});

	const secondaryAttackers = attackers.slice(1).map(a => `${a.country} ${a.flag}`).join('\n') || 'None'; //thanks to claude bc i have no idea how tf this works
	const secondaryDefenders = defenders.slice(1).map(d => `${d.country} ${d.flag}`).join('\n') || 'None';

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Created by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${front.name}`)
		.addFields(
			{ name: 'Primary Attacker', value: `${attacker1.country + " " + attacker1.flag}`, inline: true },
			{ name: 'Primary Defender', value: `${defender1.country + " " + defender1.flag}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
			{ name: 'Attack Leader', value: `${atkleader.country}`, inline: true },
			{ name: 'Defense Leader', value: `${defleader.country}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
			{ name: 'Other Attackers', value: `${secondaryAttackers}`, inline: true },
			{ name: 'Other Defenders', value: `${secondaryDefenders}`, inline: true },
		)
		.setDescription(`<:mewhenbadrp:1301096102635900969>`);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return (
		new djs.SlashCommandBuilder()
			.setName('create-front')
			.setDescription('Add a new front to the game')
			.addStringOption(option => option.setName('name').setDescription('do not type türkiye').setRequired(true))
			.addStringOption(option => option.setName('attacker1').setDescription('The (primary) attacking country of the front (aggressor)').setRequired(true))
			.addStringOption(option => option.setName('attackleader').setDescription('The leader of the attacking side, starts all battles').setRequired(true))
			.addStringOption(option => option.setName('defender1').setDescription('The (primary) defending country of the front (victim)').setRequired(true))
			.addStringOption(option => option.setName('defendleader').setDescription('The leader of the defending side, starts all battles').setRequired(true))
			.addStringOption(option => option.setName('attacker2').setDescription('A (secondary) attacking country of the front').setRequired(false))
			.addStringOption(option => option.setName('attacker3').setDescription('A (secondary) attacking country of the front').setRequired(false))
			.addStringOption(option => option.setName('attacker4').setDescription('A (secondary) attacking country of the front').setRequired(false))
			.addStringOption(option => option.setName('attacker5').setDescription('A (secondary) attacking country of the front').setRequired(false))
			.addStringOption(option => option.setName('defender2').setDescription('A (secondary) defending country of the front (victim)').setRequired(false))
			.addStringOption(option => option.setName('defender3').setDescription('A (secondary) defending country of the front (victim)').setRequired(false))
			.addStringOption(option => option.setName('defender4').setDescription('A (secondary) defending country of the front (victim)').setRequired(false))
			.addStringOption(option => option.setName('defender5').setDescription('A (secondary) defending country of the front (victim)').setRequired(false))
	);
};
