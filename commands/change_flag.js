const djs = require('discord.js');
const settings = require('../settings.json');
module.exports.interaction = async (interaction, game) => {
  await interaction.deferReply();
  const flag = interaction.options.getString('flag');

  const country = game.getPlayer(interaction.user.id);

  if (!country) return await interaction.editReply('You do not have a country claimed!');

  country.flag = flag;

  const embed = new djs.EmbedBuilder()
    .setTimestamp()
    .setColor(settings.color)
    .setFooter({ text: `Changed by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
    .setTitle(`Country flag changed`)
    .setDescription(`Your country's (${country.country}'s) flag has been changed to  ${flag}!`);

  await interaction.editReply({ embeds: [embed] });
};
module.exports.button = async interaction => { };
module.exports.application_command = () => {
  return new djs.SlashCommandBuilder()
    .setName('change-flag')
    .setDescription('change the flag of your country')
    .addStringOption(option =>
      option
        .setName('flag')
        .setDescription('The flag you want to set your country to')
        .setRequired(true),
    );
};