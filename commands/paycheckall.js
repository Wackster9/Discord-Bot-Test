// commands/paycheckall.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { aiSpend } = require('../index.js'); // Assuming aiSpend is exported from index.js

module.exports.application_command = () =>
    new SlashCommandBuilder()
        .setName('paycheckall')
        .setDescription('Manually triggers a full paycheck cycle for all countries (upkeep, loans, income).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports.interaction = async (interaction, game, client) => { // Removed Country, not needed here
    if (!game.started) {
        return await interaction.reply({
            content: 'The game hasn’t started yet, you can’t force time forward.',
            ephemeral: true
        });
    }

    await interaction.deferReply(); 

    const transactionLogs = [];
    const events = client.economicEvents[interaction.guild.id] || [];

    for (const c of game.countries) {
        let countryLog = {
            name: c.country,
            initialMoney: c.money,
            upkeep: 0,
            debtPayment: 0,
            debtInterest: 0,
            baseIncome: 0,
            finalIncome: 0,
            netChange: 0,
        };

        // =========================================================================
        // STEP 1: UPKEEP - The cost of having nice things
        // =========================================================================
        const armyUpkeep = c.army * (client.armyUpkeep[interaction.guild.id] || 0);
        const tankUpkeep = c.tank * (client.tankUpkeep[interaction.guild.id] || 0);
        const totalUpkeep = armyUpkeep + tankUpkeep;
        c.money -= totalUpkeep;
        countryLog.upkeep = totalUpkeep;

        // =========================================================================
        // STEP 2: LOANS - The past comes to collect
        // =========================================================================
        if (c.debts) {
            for (const lenderName in c.debts) {
                const debt = c.debts[lenderName];
                const lender = game.getCountry(lenderName);
                if (!lender) continue;

                // Interest accrues
                const interestAdded = debt.currentPrincipal * debt.interestRate;
                debt.currentPrincipal += interestAdded;
                debt.totalInterestPaid = (debt.totalInterestPaid || 0) + interestAdded;
                countryLog.debtInterest += interestAdded;

                // Mandatory payment is made
                const paymentDue = debt.originalPrincipal * debt.paymentRate;
                const actualPayment = Math.min(paymentDue, c.money);
                
                if (actualPayment > 0) {
                    c.money -= actualPayment;
                    lender.money += actualPayment;
                    debt.currentPrincipal -= actualPayment;
                    countryLog.debtPayment += actualPayment;
                }

                if (debt.currentPrincipal <= 0) {
                    // Handle overpayment refund if necessary
                    const refund = Math.abs(debt.currentPrincipal);
                    if (refund > 0) {
                        c.money += refund;
                        lender.money -= refund;
                    }
                    delete c.debts[lenderName];
                }
            }
        }

        // =========================================================================
        // STEP 3: INCOME - Finally, some good news
        // =========================================================================
        const basePaycheck = c.industry / 20;
        countryLog.baseIncome = basePaycheck;
        
        let totalPercentChange = 0;
        events.forEach(event => {
            const isCountryInList = event.countries.includes(c.country);
            const shouldBeAffected = event.isExclusionList ? !isCountryInList : isCountryInList;
            if (shouldBeAffected) {
                totalPercentChange += event.modifier;
            }
        });
        const finalModifier = 1.0 + totalPercentChange;

        const finalPaycheck = Math.floor(basePaycheck * finalModifier);
        c.money += finalPaycheck;
        countryLog.finalIncome = finalPaycheck;

        // =========================================================================
        // STEP 4: AI SPENDING
        // =========================================================================
        if (!c.pid) {
            aiSpend(c, interaction.guild.id, client);
        }
        
        countryLog.netChange = c.money - countryLog.initialMoney;
        transactionLogs.push(`${c.flag} **${c.country}**: Net change: **$${Math.round(countryLog.netChange).toLocaleString()}** (Income: $${Math.round(countryLog.finalIncome)}, Upkeep: $${Math.round(countryLog.upkeep)}, Debt: $${Math.round(countryLog.debtPayment)})`);
    }

    // Process event durations
    if (events.length > 0) {
        events.forEach(event => event.paychecksRemaining--);
        client.economicEvents[interaction.guild.id] = events.filter(event => event.paychecksRemaining > 0);
    }
    
    // Assembling the response...
    let responseMessage = '💰 **Manual Paycheck Cycle Complete**\n';
    const messageChunks = [];
    let currentChunk = responseMessage;

    for (const line of transactionLogs) {
        if ((currentChunk + line + '\n').length > 1950) {
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