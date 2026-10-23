const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports.application_command = () =>
    new SlashCommandBuilder()
        .setName('paycheckall')
        .setDescription('Distributes paychecks to all countries.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports.interaction = async (interaction, game, Country, Front, client) => {
    if (!game.started) {
        return await interaction.reply({
            content: 'The game hasn’t started yet!',
            ephemeral: true
        });
    }

    const addedMoney = [];
    const guildId = interaction.guild.id;
    const events = client.economicEvents?.[guildId] || []; 

    game.countries.forEach(c => {
        const basePaycheck = (c.industry / 20) - (
            c.tank * (client.tankUpkeep?.[guildId] || 0) + 
            c.army * (client.armyUpkeep?.[guildId] || 0)
        );

        let totalPercentChange = 0;
        events.forEach(event => {
            const isCountryInList = event.countries.includes(c.country);
            const shouldBeAffected = event.isExclusionList ? !isCountryInList : isCountryInList;
            
            if (shouldBeAffected) {
                totalPercentChange += event.modifier;
            }
        });

        const finalModifier = 1.0 + totalPercentChange;
        const finalPaycheck = basePaycheck * finalModifier;

        c.money += finalPaycheck;
        addedMoney.push(`${c.country}: $${finalPaycheck.toFixed(2)}`);

        // Trigger AI spending for unclaimed countries
        if (!c.pid) {
            game.aiSpend(c, guildId, client);
        }
    });

    if (events.length > 0) {
        events.forEach(event => event.paychecksRemaining--);
        client.economicEvents[guildId] = events.filter(event => event.paychecksRemaining > 0);
    }

    if (addedMoney.length === 0) {
        return await interaction.reply({ content: 'No countries received money.' });
    }

    // THE FIX: Chunk the message because Discord cannot handle your 1933 country list
    const chunks = [];
    let currentChunk = "💰 **Paycheck distribution (Modifiers Applied):**\n";
    
    for (const line of addedMoney) {
        // Stop at 1900 to give a safe buffer before the 2000 character limit
        if (currentChunk.length + line.length + 1 > 1900) {
            chunks.push(currentChunk);
            currentChunk = "";
        }
        currentChunk += line + "\n";
    }
    if (currentChunk) chunks.push(currentChunk);

    // Send the first chunk as the initial reply
    await interaction.reply({ content: chunks[0] });
    
    // Send the remaining chunks as follow-ups
    for (let i = 1; i < chunks.length; i++) {
        await interaction.followUp({ content: chunks[i] });
    }
};