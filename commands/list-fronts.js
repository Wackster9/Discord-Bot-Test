const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

	const fronts = game.fronts.filter(f => f.active);

	if (fronts.length === 0) return interaction.editReply('There are no active fronts.');

	const embed = new djs.EmbedBuilder().setColor(settings.color);
	let description = '';

	for (let i = 0; i < fronts.length; i++) {
		const front = fronts[i];
		const attackerList = front.attackers.map(a => `${a.country} ${a.flag}`).join('\n⚔️ ');
		const defenderList = front.defenders.map(d => `${d.country} ${d.flag}`).join('\n🛡️ ');
		description += `**${i + 1}. ${front.name}**\n`;
		description += `⚔️ ${attackerList}\n`;
		description += `🛡️ ${defenderList}\n\n`;
	}

	const splitted = description.match(/[\s\S]{1,3800}(?=\n|$)/g);
	for (let i = 0; i < splitted.length; i++) {
		const split = splitted[i];
		switch (i) {
			case 0:
				embed.setTitle(`Active Fronts (${fronts.length})`).setDescription(split);
				await interaction.editReply({ embeds: [embed] });
				embed.setTitle(null);
				break;
			case splitted.length - 1:
				embed.setDescription(split).setTimestamp()
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
		.setName('list-fronts')
		.setDescription('Lists all active fronts in the game.');
};