const djs = require('discord.js');

module.exports.interaction = async (interaction, game) => {
    // go awway loser (if not admin)
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can apply buffs.', ephemeral: true });
    }

    // This part is for the admins. It's a public announcement.
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
            country.tempAttackBuffs.push(buffObject);
        } else {
            country.tempDefenseBuffs.push(buffObject);
        }
        replyMessage = `Applied a temporary ${type} buff of ${value}x to ${country.country} for ${uses} uses.`;
    } else {
        if (value === 1) { // Reset logic
             if (type === 'attack') {
                country.attackBuff = 1.0;
            } else {
                country.defenseBuff = 1.0;
            }
            replyMessage = `Reset the permanent ${type} buff for ${country.country} to default (1.0x).`;
        } else {
            if (type === 'attack') {
                country.attackBuff = value;
            } else {
                country.defenseBuff = value;
            }
            replyMessage = `Set the permanent ${type} buff for ${country.country} to ${value}x.`;
        }
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
        .addNumberOption(option => option.setName('value').setDescription('The buff multiplier (e.g., 1.25 for +25%). Use 1 to reset.').setRequired(true))
        .addIntegerOption(option => option.setName('uses').setDescription('Number of uses (wars). Leave blank for a permanent buff.').setRequired(false));
};
