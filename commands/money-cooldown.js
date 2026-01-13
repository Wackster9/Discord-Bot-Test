const djs = require('discord.js');
const settings = require('../settings.json');

module.exports.interaction = async (interaction, game, Country, client) => { // Added client here, need to pass it in index.js
	await interaction.deferReply();

	if (!game.started) return interaction.editReply('The game has not started yet.');

    const guildId = interaction.guild.id;
    const gameStart = client.gameStart[guildId];
    const minutesPerMonth = client.minutesPerMonth[guildId];

    if (!gameStart || !minutesPerMonth) {
        return interaction.editReply('Could not determine game time settings.');
    }

    // --- THE MATH ---
    // 1. Calculate how many milliseconds are in one "month" (one paycheck cycle)
    const msPerMonth = Number(minutesPerMonth) * 60 * 1000;

    // 2. Calculate how much time has passed since the game started
    const msPassed = Date.now() - gameStart;

    // 3. Calculate how many full months have passed
    const monthsPassed = Math.floor(msPassed / msPerMonth);

    // 4. Determine when the NEXT quarterly paycheck is due
    // Paychecks happen at month index 0, 3, 6, 9.
    // We need to find the next multiple of 3 that is greater than the current month index.
    
    const currentMonthIndex = monthsPassed % 12; // 0-11 (Jan-Dec)
    const quarterMonths = [0, 3, 6, 9, 12]; // 12 is technically "next January"
    
    // Find the next payday month index
    let nextPayMonthIndex = quarterMonths.find(m => m > currentMonthIndex);
    
    // If we are currently in Dec (11), next is 12 (which means next year's Jan)
    // We need to calculate the *total* months to that point.
    // Total months passed + (distance to next pay month)
    
    const monthsUntilPayday = nextPayMonthIndex - currentMonthIndex;
    
    // Calculate the timestamp for that future moment
    // (Current Time) + (Time remaining in current month) + (Full months until payday)
    // Actually, simpler: (Start Time) + ((Total Months + Months Until Payday) * msPerMonth)
    
    // Total months including the current partial one? No.
    // Let's do: Target Total Months = (monthsPassed - currentMonthIndex) + nextPayMonthIndex
    // Wait, simpler.
    
    // Total Months Played So Far = monthsPassed.
    // Current Month Index = monthsPassed % 12.
    // Next Pay Month Index (0, 3, 6, 9).
    // Diff = nextPayMonthIndex - currentMonthIndex.
    // (If diff is negative/zero, we add 12? No, we used the list find 
