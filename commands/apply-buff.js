const djs = require('discord.js');

module.exports.interaction = async (interaction, game) => {
    await interaction.deferReply();

    const countryName = interaction.options.getString('country');
    const type = interaction.options.getString('type');
    const value = interaction.options.getNumber('value');
    const uses = interaction.options.getInteger('uses');

    const country = game.getCountry(countryName);

    if (!country) {
        return interaction.editReply('Invalid country specified.');
    }
    if (value <= 0) {
        return interaction.editReply('Buff value must be a positive number (e.g., 1.2 for a 20% buff).');
    }

    // SAFETY PATCH: Initialize arrays if they are missing (e.g. old save files)
    if (!country.tempAttackBuffs) country.tempAttackBuffs = [];
    if (!country.tempDefenseBuffs) country.tempDefenseBuffs = [];

    let replyMessage = '';

    if (uses) {
        // This matches perfectly with the Country.js .reduce() logic
        const buffObject = { value, uses };
        if (type === 'attack') {
            if (country.tempAttackBuffs.length > 0)
                country.tempAttackBuffs = [];
            country.tempAttackBuffs.push(buffObject);
        } else {
            if (country.tempDefenseBuffs.length > 0)
                country.tempDefenseBuffs = [];
            country.tempDefenseBuffs.push(buffObject);
        }
        replyMessage = `Applied a temporary ${type} buff of ${value}x to ${country.country} for ${uses} uses.`;
    } else {
        if (type === 'attack') {
            country.attackBuff = value;
        } else {
            country.defenseBuff = value;
        }
        replyMessage = `Set the permanent ${type} buff for ${country.country} to ${value}x.`;
    }

    await interaction.editReply(replyMessage);
};

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('apply-buff')
        .setDescription('Applies a permanent or temporary buff to a country.')
        .setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
        .addStringOption(option => option.setName('country').setDescription('The country to buff.').setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of buff.')
                .setRequired(true)
                .addChoices({ name: 'Attack', value: 'attack' }, { name: 'Defense', value: 'defense' })
        )
        .addNumberOption(option => option.setName('value').setDescription('The buff multiplier (e.g., 1.25 for +25%). Use 1 to reset.').setRequired(true))
        .addIntegerOption(option => option.setName('uses').setDescription('Number of uses (wars). Leave blank for a permanent buff.').setRequired(false));
};
