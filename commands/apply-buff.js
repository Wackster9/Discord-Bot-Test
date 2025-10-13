const djs = require('discord.js');

module.exports.interaction = async (interaction, game) => {
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can apply buffs.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const countryName = interaction.options.getString('country');
    const type = interaction.options.getString('type');
    const value = interaction.options.getNumber('value');
    const uses = interaction.options.getInteger('uses'); // This will be null if not provided

    const country = game.getCountry(countryName);

    if (!country) {
        return interaction.editReply('Invalid country specified.');
    }
    if (value <= 0) {
        return interaction.editReply('Buff value must be a positive number (e.g., 1.2 for a 20% buff).');
    }

    let replyMessage = '';

    if (uses) {
        // This is a TEMPORARY buff
        const buffObject = { value, uses };
        if (type === 'attack') {
            country.tempAttackBuffs.push(buffObject);
        } else {
            country.tempDefenseBuffs.push(buffObject);
        }
        replyMessage = `Applied a temporary ${type} buff of ${value}x to ${country.country} for ${uses} uses.`;
    } else {
        // This is a PERMANENT buff
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
        .addStringOption(option => option.setName('country').setDescription('The country to buff.').setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of buff.')
                .setRequired(true)
                .addChoices({ name: 'Attack', value: 'attack' }, { name: 'Defense', value: 'defense' })
        )
        .addNumberOption(option => option.setName('value').setDescription('The buff multiplier (e.g., 1.25 for +25%).').setRequired(true))
        .addIntegerOption(option => option.setName('uses').setDescription('Number of uses (wars). Leave blank for a permanent buff.').setRequired(false));
};