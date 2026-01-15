const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const attackerCountry = interaction.options.getString('attacker');
	const defenderCountry = interaction.options.getString('defender');
	const armyAmount = interaction.options.getInteger('army'); // NEW: Get the army amount

	const attacker = game.getCountry(attackerCountry);
	const defender = game.getCountry(defenderCountry);

	if (!game.started) return interaction.editReply('Quit being a quickshot there aint no game yet.');
	if (!attacker) return interaction.editReply('Invalid attacking country specified.');
	if (!defender) return interaction.editReply('Who you tryna war? Hyperborea?');
	if (attacker.country === defender.country) return interaction.editReply('Thats the same country.');
    
    // NEW: Validation for force wars
    if (armyAmount) {
        if (armyAmount <= 0) return interaction.editReply('You cannot send 0 or negative soldiers.');
        if (armyAmount > attacker.army) return interaction.editReply(`Attacker only has ${attacker.army} army! You cannot force them to send ${armyAmount}.`);
    }

    // UPDATED: Pass armyAmount to the calculation
	const result = attacker.constructor.getWarResult(attacker, defender, armyAmount);

    // DECREMENT AND CLEAN UP BUFFS
    // Attacker's buffs
    attacker.tempAttackBuffs.forEach(buff => buff.uses--);
    attacker.tempAttackBuffs = attacker.tempAttackBuffs.filter(buff => buff.uses > 0);

    // Defender's buffs
    defender.tempDefenseBuffs.forEach(buff => buff.uses--);
    defender.tempDefenseBuffs = defender.tempDefenseBuffs.filter(buff => buff.uses > 0);

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `War force started by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`Battle Overview`)
		.setDescription(
			`The battle between ${attacker.country} ${attacker.flag} and ${defender.country} ${defender.flag} has ended.\n\n${result.winner === attacker
				? `${attacker.country} ${attacker.flag} <@${attacker.pid}> has beaten ${defender.country} ${defender.flag} <@${defender.pid ? defender.pid : 'unclaimed'
				}> and won the battle.`
				: `${defender.country} ${defender.flag} <@${defender.pid ? defender.pid : 'unclaimed'}> has held off against ${attacker.country} ${attacker.flag
				} <@${attacker.pid}> and won the battle.`
			}\n\n${attacker.country} ${attacker.flag} lost ${result.atkLoses} army.\n${defender.country} ${defender.flag} lost ${result.defLoses} army.`,
		);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('forcewar')
		.setDescription('Use this to force wars. You know what they say, RH Sports, its in the name.')
		.addStringOption(option =>
			option.setName('attacker')
				.setDescription('The name or number of your country that will attack.')
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('defender')
				.setDescription('The name or number of the country you want to attack.')
				.setRequired(true)
		)
				//army amnt 
        .addIntegerOption(option => 
            option.setName('army').setDescription('How much army to force send (Default: All).').setRequired(false)
        );
};
