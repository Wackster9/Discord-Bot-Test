const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const front = game.getFront(interaction.options.getString('front'));
	if (!front) return interaction.editReply('Front not found.');

	const Attackers = front.attackers.slice(0).map(a => `${a.country} ${a.flag}`).join('\n') || 'None'; //thanks to claude bc i have no idea how tf this works
	const Defenders = front.defenders.slice(0).map(d => `${d.country} ${d.flag}`).join('\n') || 'None';

	const embed = new djs.EmbedBuilder()
		.setTitle(`${front.name}`)
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.addFields(
			{ name: 'Attackers', value: `${Attackers}`, inline: true },
			{ name: 'Defenders', value: `${Defenders}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
			{ name: 'Attack Leader', value: `${front.atkleader.country}`, inline: true },
			{ name: 'Defense Leader', value: `${front.defleader.country}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
			{ name: 'Attacker Army', value: `${Object.values(front.attackerArmies).reduce((sum, n) => sum + n, 0)}`, inline: true },
			{ name: 'Attacker Tanks', value: `${Object.values(front.attackerTanks).reduce((sum, n) => sum + n, 0)}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
			{ name: 'Defender Army', value: `${Object.values(front.defenderArmies).reduce((sum, n) => sum + n, 0)}`, inline: true },
			{ name: 'Defender Tanks', value: `${Object.values(front.defenderTanks).reduce((sum, n) => sum + n, 0)}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
			{ name: 'Attacker War Score', value: `${Math.floor(Object.values(front.attackerArmies).reduce((sum, n) => sum + n, 0) * 1 + Object.values(front.attackerTanks).reduce((sum, n) => sum + n, 0) / 50)}`, inline: true },
			{ name: 'Defender War Score', value: `${Math.floor(Object.values(front.defenderArmies).reduce((sum, n) => sum + n, 0) * 1 + Object.values(front.defenderTanks).reduce((sum, n) => sum + n, 0) / 50)}`, inline: true },
		);
	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('front-status')
		.setDescription("Check a front's information.")
		.addStringOption(option =>
			option.setName('front').setDescription('The name of the front you want to view.').setRequired(true),
		);
};
