const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const country = interaction.options.getString('country');
	const armyAmount = interaction.options.getInteger('army');
	const p = game.getPlayer(interaction.user.id);
	const c = game.getCountry(country);
	if (!game.started) return interaction.editReply('Quit being a quickshot there aint no game yet.');
	if (!p) return interaction.editReply('No, you cannot roleplay as the UN intervention in Yugoslavia. Claim a country.');
	if (!c) return interaction.editReply('Who you tryna war? Hyperborea?');
	if (!p.active) return interaction.editReply('Quit hacking, this doesnt work anymore');
	//if (!c.active) return interaction.editReply('Target country is inactive.');
	//if (!c.pid) return interaction.editReply('This country is unclaimed.');
	if (c.pid === interaction.user.id) return interaction.editReply('You cannot declare war on yourself.');
	//Keep the comments if you want to allow players to fight unclaimed countries
	if (armyAmount) {
    if (armyAmount <= 0) return interaction.editReply('You cannot send 0 or negative soldiers.');
    if (armyAmount > p.army) return interaction.editReply(`You only have ${p.army} army! You cannot send ${armyAmount}.`);
}
	const result = p.constructor.getWarResult(p, c, armyAmount);
// ... right after 'const result = p.constructor.getWarResult(p, c);'

// DECREMENT AND CLEAN UP BUFFS
// Attacker's buffs
p.tempAttackBuffs.forEach(buff => buff.uses--);
p.tempAttackBuffs = p.tempAttackBuffs.filter(buff => buff.uses > 0);

// Defender's buffs
c.tempDefenseBuffs.forEach(buff => buff.uses--);
c.tempDefenseBuffs = c.tempDefenseBuffs.filter(buff => buff.uses > 0);

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `War started by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`Battle Overview`)
		.setDescription(
			`The battle between ${p.country} ${p.flag} and ${c.country} ${c.flag} has ended.\n\n${result.winner === p
				? `${p.country} ${p.flag} <@${p.pid}> has beaten ${c.country} ${c.flag} <@${c.pid ? c.pid : 'unclaimed'
				}> and won the battle.`
				: `${c.country} ${c.flag} <@${c.pid ? c.pid : 'unclaimed'}> has held off against ${p.country} ${p.flag
				} <@${p.pid}> and won the battle.`
			}\n\n${p.country} ${p.flag} lost ${result.atkLoses} army.\n${c.country} ${c.flag} lost ${result.defLoses} army.`,
		);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('war')
        .setDescription('Start a battle against another country.')
        .addStringOption(option =>
            option.setName('country').setDescription('The target country.').setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName('army').setDescription('How much army to send (Default: All).').setRequired(false)
        );
};
