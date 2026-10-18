const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply();

    const countryName = interaction.options.getString('country');
    let newHp = interaction.options.getInteger('hp');

    const country = game.getCountry(countryName);
    if (!country) {
        return interaction.editReply('Country not found!');
    }

    const oldHp = country.hp;

    if (newHp > country.mhp)
        newHp = country.mhp;
    if (newHp < 0)
        newHp = 0;
    country.hp = newHp;

    const embed = new djs.EmbedBuilder()
        .setColor(settings.color)
        .setTitle('Country HP Updated')
        .setDescription(`Changed HP of **${countryName}** ${country.flag}`)
        .addFields(
            { name: 'Old HP', value: String(oldHp), inline: true },
            { name: 'New HP', value: String(newHp), inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('change-hp')
        .setDescription('ADMIN: Change a country\'s hp')
        .setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('country')
                .setDescription('The country to modify')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('hp')
                .setDescription('Select HP value. If you do above the maximum, it will become the maximum.')
                .setRequired(true)
        )
};