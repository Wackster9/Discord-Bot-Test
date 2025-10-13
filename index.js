const djs = require('discord.js');
const fs = require('fs');
const client = new djs.Client({
	intents: ['Guilds', 'GuildMessages', 'MessageContent'].map(r => djs.IntentsBitField.Flags[r]),
});
const settings = require('./settings.json');

// --- THE COUNTRY AND GAME CLASSES ARE UNCHANGED. WE LEAVE THEM BE. ---
class Country {
	constructor(country, industry, army, tank, money, type, flag) {
		this.country = country;
		this.pid = '';
		this.industry = industry;
		this.army = army;
		this.tank = tank;
		this.money = money;
		this.type = type;
		this.flag = flag || '🏳️';
		this.active = true;
        this.attackBuff = 1.0;
        this.defenseBuff = 1.0;
        this.aiPriorities = null; 
	    this.tempAttackBuffs = [];
        this.tempDefenseBuffs = []; 
    }
    // ... all the country methods are fine ...
    // getWarScore, calculateWinChance, getWarResult, etc. They are innocent.
}

class Game {
	constructor() {
		this.countries = require('./countries/countries-1933.js').countries.map(c => new Country(...c));
		this.started = false;
	}
    // ... all the game methods are also fine ...
}

const games = {};

// --- DELETED ---
// The old setInterval for money has been surgically removed. 
// It was redundant. It was causing chaos. It is gone.
// --- DELETED ---

function aiSpend(country, guild, client) {
    // ... the aiSpend function is fine ...
}

// ... SaveGame Manager is fine ...

// Track last processed paycheck month for each guild
client.lastPaycheckMonth = {};

// Monthly paycheck trigger - THE ONLY PLACE MONEY SHOULD COME FROM
setInterval(async () => {
	for (const guildId of Object.keys(games)) {
		const game = games[guildId];
		if (!game.started) continue;

		const msDiff = Date.now() - client.gameStart[guildId];
		const minutesPerMonth = client.minutesPerMonth[guildId];
		const monthsPassed = Math.floor(msDiff / (1000 * 60 * Number(minutesPerMonth)));

		const currentMonthIndex = monthsPassed % 12;
		const quarterMonths = [0, 3, 6, 9]; 

		if (quarterMonths.includes(currentMonthIndex)) {
			if (client.lastPaycheckMonth[guildId] !== currentMonthIndex) {
				console.log(`Triggering paycheck for guild ${guildId} in month index ${currentMonthIndex}`);

				// <<< THE ONLY PAYCHECK LOGIC THAT SHOULD EXIST >>>
                // The old, simple forEach loop has been removed. This is its replacement.
                const events = client.economicEvents[guildId] || [];

                game.countries.forEach(c => {
                    // 1. Calculate the base paycheck
                    const basePaycheck = (c.industry / 20) - (c.tank * client.tankUpkeep[guildId] + c.army * client.armyUpkeep[guildId]);

                    // 2. Determine the total economic modifier for this country
                    let finalModifier = 1.0;
                    events.forEach(event => {
                        const isCountryInList = event.countries.includes(c.country);
                        const shouldBeAffected = event.isExclusionList ? !isCountryInList : isCountryInList;
                        
                        if (shouldBeAffected) {
                            finalModifier *= event.modifier;
                        }
                    });

                    // 3. Apply the modified paycheck
                    c.money += basePaycheck * finalModifier;

                    // AI still needs to spend money if it's an AI country
                    if (!c.pid) {
                        aiSpend(c, guildId, client);
                    }
                });

                // After everyone has been paid, update the events
                if (events.length > 0) {
                    events.forEach(event => event.paychecksRemaining--);
                    client.economicEvents[guildId] = events.filter(event => event.paychecksRemaining > 0);
                }  
                // <<< END OF THE CORRECT PAYCHECK LOGIC >>>

				client.lastPaycheckMonth[guildId] = currentMonthIndex;
			}
		} else {
			client.lastPaycheckMonth[guildId] = null;
		}
	}
}, 1000 * 60); // check every minute


// ... Commands handler and the rest of the file is fine ...

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	await require('./deploy-commands.js')(client);
	client.interval = Date.now();
	client.gameStart = {};
	client.yearStart = {};
	client.tankCost = {};
	client.tankUpkeep = {};
	client.armyUpkeep = {};
	client.minutesPerMonth = {};
    client.aiPriorities = {};
    client.economicEvents = {}; 
});

// ... interactionCreate and messageCreate are fine ...

client.login(settings.token);