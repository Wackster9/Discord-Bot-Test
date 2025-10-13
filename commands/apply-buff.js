const djs = require('discord.js');

module.exports.interaction = async (interaction, game) => {
    // This part is for the peasants. It's a private "get lost" message.
    if (!interaction.member.permissions.has(djs.PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: 'Only admins can apply buffs.', ephemeral: true });
    }

    // This part is for the admins. It's a public announcement.
    await interaction.deferReply(); // No longer ephemeral

    const countryName = interaction.options.getString('country');
    const type = interaction.options.getString('type');
    const value = interaction.options.getNumber('value');
    const uses = interaction.options.getInteger('uses');

    const country = game.getCountry(countryName);

    if (!country) {
        return interaction.editReply('Invalid country specified.'); // Now public
    }
    if (value <= 0) {
        return interaction.editReply('Buff value must be a positive number (e.g., 1.2 for a 20% buff).'); // Now public
    }

    let replyMessage = '';

    if (uses) {
        const buffObject = { value, uses };
        if (type === 'attack') {
            country.tempAttackBuffs.push(buffObject);
        } else {
            country.tempDefenseBuffs.push(buffObject);
        }
        replyMessage = `Applied a temporary ${type} buff of ${value}x to ${country.country} for ${uses} uses.`;
    } else {
        if (value === 1) { // We're keeping the reset logic because it's smart.
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

    await interaction.editReply(replyMessage); // Now public
};
