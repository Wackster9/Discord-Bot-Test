const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {
	await interaction.deferReply();
	const user = interaction.options.getUser('user');
	const amount = interaction.options.getInteger('amount');
	const country = game.getPlayer(interaction.user.id);
	const recipient = game.getPlayer(user.id);

	if (!game.started) return interaction.editReply('The game has not started yet.');
	if (!recipient) return interaction.editReply('The recipient has not claimed a country yet.');
	if (!country) return interaction.editReply('You have not claimed a country yet.');
	if (!country.active) return interaction.editReply('Your country is inactive.');
	if (!recipient.active) return interaction.editReply('Recipient country is inactive.');
	if (amount < 1) return interaction.editReply('You must send at least 1 industry.');
	if (country.industry < amount) return interaction.editReply('You do not have enough industry.');
	if (country.pid === recipient.pid) return interaction.editReply('You cannot send industry to yourself.');

	country.industry -= amount;
	recipient.industry += amount;

	const embed = new djs.EmbedBuilder()
		.setTimestamp()
		.setColor(settings.color)
		.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
		.setTitle(`${country.country} ${country.flag}`)
		.setDescription(`You have sent ${amount} industry to ${recipient.country} ${recipient.flag}.`)
		.addFields(
			{ name: 'Industry', value: `${Math.floor(country.industry)}`, inline: true },
			{ name: 'Recipient Industry', value: `${Math.floor(recipient.industry)}`, inline: true },
		);

	await interaction.editReply({ embeds: [embed] });
};

module.exports.button = async interaction => {};

module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('send-industry')
		.setDescription('Send industry to another player.')
		.addUserOption(option => option.setName('user').setDescription('The user you want to send industry to.').setRequired(true))
		.addIntegerOption(option => option.setName('amount').setDescription('The amount of industry you want to send.').setRequired(true));
};
