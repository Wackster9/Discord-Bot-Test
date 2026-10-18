const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const name = interaction.options.getString('name');

	const country = game.getPlayer(interaction.user.id);

	if (!country) return await interaction.editReply('You do not have a country claimed!');
	if(parseInt(name).toString() == name)
        return await interaction.editReply('You cannot name your country a number.');
	country.country = name;

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Changed by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`Country name changed`)
		.setDescription(`${country.flag} Your country name has been changed to ${name}!`);

	await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => {};
module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('rename')
		.setDescription('Rename your country')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The name you want to set your country to')
				.setRequired(true)
				.setMaxLength(settings.maxCountryNameLength),
		);
};
