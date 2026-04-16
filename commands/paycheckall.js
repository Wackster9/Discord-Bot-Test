const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { aiSpend } = require('../index.js'); 

module.exports.application_command = () =>
    new SlashCommandBuilder()
        .setName('paycheckall')
        .setDescription('Distributes paychecks to all countries, CONSIDERING economic events.') 
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports.interaction = async (interaction, game, Country, client) => { // client added so it can call economicevents
    if (!game.started) {
        return await interaction.reply({
            content: 'The game hasn’t started yet, you eager beaver.',
            ephemeral: true
        });
    }
    
    await interaction.deferReply(); // man I'm bummed out

    const addedMoney = [];
    
    // check for all events
    const events = client.economicEvents[interaction.guild.id] || [];

    game.countries.forEach(c => {
        
        let totalPercentChange = 0; 

        // check all events
        events.forEach(event => {
            const isCountryInList = event.countries.includes(c.country);
            const shouldBeAffected = event.isExclusionList ? !isCountryInList : isCountryInList;

            if (shouldBeAffected) {
                // modifiera asd together
                totalPercentChange += event.modifier;
            }
        });

        const finalModifier = 1.0 + totalPercentChange;

        const basePaycheck = c.industry / 20;
        const finalPaycheck = Math.floor(basePaycheck * finalModifier);
       

        c.money += finalPaycheck;
        addedMoney.push(`${c.country}: $${finalPaycheck} (Modifier: ${finalModifier.toFixed(2)}x)`);

 // ai spends monsy
        if (!c.pid) {
            aiSpend(c, interaction.guild.id, client);
        }
    });

    // 
    let responseMessage = addedMoney.length > 0
        ? `💰 Paycheck distribution complete:\n`
        : 'No countries received money.';

    // in case character limit is reached
    const messageChunks = [];
    let currentChunk = responseMessage;
    for (const line of addedMoney) {
        if (currentChunk.length + line.length + 1 > 1900) { // A little buffer
            messageChunks.push(currentChunk);
            currentChunk = '';
        }
        currentChunk += line + '\n';
    }
    messageChunks.push(currentChunk);

    await interaction.editReply(messageChunks[0]);
    for (let i = 1; i < messageChunks.length; i++) {
        await interaction.followUp(messageChunks[i]);
    }
};