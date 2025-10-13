const djs = require('discord.js');
const fs = require('fs');
const client = new djs.Client({
	intents: ['Guilds', 'GuildMessages', 'MessageContent'].map(r => djs.IntentsBitField.Flags[r]),
});
// 'GuildMembers'
const settings = require('./settings.json');

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
 this.attackBuff = 1.0; // 1.0 means 100%, or no buff
 this.defenseBuff = 1.0; // Same here
 this.aiPriorities = null; 
	this.tempAttackBuffs = []; // e.g., [{ value: 1.25, uses: 3 }]
this.tempDefenseBuffs = []; // e.g., [{ value: 1.50, uses: 1 }] 
}

	getWarScore() {
		return this.army + Math.floor(this.army * (this.tank / 50));
	}

static calculateWinChance(attacker, defender) {
    // The defender gets a 20% defensive bonus now, applied directly to their score.
    // Calculate the total combined buff for the attacker
const totalAttackBuff = attacker.tempAttackBuffs.reduce((total, buff) => total * buff.value, attacker.attackBuff);
const attackerScore = attacker.getWarScore() * totalAttackBuff;

// Calculate the total combined buff for the defender
const totalDefenseBuff = defender.tempDefenseBuffs.reduce((total, buff) => total * buff.value, defender.defenseBuff);
const defenderScore = defender.getWarScore() * 1.2 * totalDefenseBuff; // The 1.2 is the base defense bonus

    // This can happen if the defender's army is 0. Avoid dividing by zero.
    if (defenderScore <= 0) return 0.93; // Attacker almost certainly wins.

    const ratio = attackerScore / defenderScore;

    // --- THE FANCY MATH PART ---
    // These constants control the shape of the curve.
    const MAX_WIN_CHANCE = 0.93; // The 93% cap zhe wanted.
    const MIDPOINT = 0.50; // The win chance when scores are equal (ratio = 1.0).
    const STEEPNESS = 0.8; // How quickly the odds ramp up. Higher = steeper.

    // The arctangent function gives us a nice S-curve from -PI/2 to +PI/2.
    // We scale and shift it to fit our desired win chance range [0.07, 0.93].
    const spread = MAX_WIN_CHANCE - MIDPOINT;
    let winChance = MIDPOINT + spread * (2 / Math.PI) * Math.atan(STEEPNESS * (ratio - 1));
    
    // Just in case, clamp the final value to be safe.
    return Math.max(1 - MAX_WIN_CHANCE, Math.min(MAX_WIN_CHANCE, winChance));
}

	static getWarResult(attacker, defender) {
    const attackerWinChance = Country.calculateWinChance(attacker, defender);
    const rng = Math.random(); // This gives a random number between 0.0 and 1.0

    const atkLoses = attacker.applyattackerWarCasualties(attacker, defender);
    const defLoses = defender.applydefenderWarCasualties(defender, attacker);
    
    return {
        winner: rng < attackerWinChance ? attacker : defender,
        loser: rng < attackerWinChance ? defender : attacker,
        atkLoses,
        defLoses,
        winChance: (attackerWinChance * 100).toFixed(1) // Let's return the odds for fun
    };
}

	applyattackerWarCasualties(attacker, defender, casualties) {
		const attackerScore = attacker.getWarScore();
		const defenderScore = defender.getWarScore() * 1.2;
		if (attackerScore / defenderScore < 1) { //if attacker has less warscore then the defender
			casualties = Math.floor(Math.random() * 0.07 * this.army + 0.1 * this.army);
		}
		else {
			casualties = Math.floor(Math.random() * 0.07 * this.army + 0.1 * this.army * ((0.8) / (attackerScore / defenderScore)));
		}
		if (casualties < 1) casualties = 1;
		this.army -= casualties;
		return casualties;
	}

	applydefenderWarCasualties(defender, attacker, casualties) {
		const attackerScore = attacker.getWarScore();
		const defenderScore = defender.getWarScore() * 1.2;
		if (defenderScore / attackerScore < 1) {
			casualties = Math.floor(Math.random() * 0.04 * this.army + 0.1 * this.army);
		}
		else {
			casualties = Math.floor(Math.random() * 0.04 * this.army + 0.1 * this.army * (1) / (defenderScore / attackerScore));
		}
		if (casualties < 1) casualties = 1;
		this.army -= casualties;
		return casualties;
	}
}

class Game {
	constructor() {
		this.countries = require('./countries/countries-1933.js').countries.map(c => new Country(...c));
		this.started = false;
	}

	start(countriesFile) {
		this.countries = require(`./countries/${countriesFile}`).countries.map(c => new Country(...c));
		this.started = true;
	}

	end() {
		this.started = false;
		this.countries = require('./countries/countries-1933.js').countries.map(c => new Country(...c));
	}

	assignCountry(pid, country) {
		const c = this.countries.find(c => c.country === country);
		if (c) {
			c.pid = pid;
			c.active = true;
			return c;
		}
	}

	getCountry(country) {
		if (!isNaN(country)) return this.countries[country - 1];
		return this.countries.find(c => c.country.toLowerCase() === country.toLowerCase());
	}

	abandonCountry(pid) {
		const c = this.countries.find(c => c.pid === pid && c.active);
		if (c) {
			c.pid = '';
			return c;
		}
	}

	getPlayer(id) {
		return this.countries.find(c => c.pid === id && c.active);
	}
}

const games = {};

//Money Interval Manager
setInterval(async () => {
	for (const guild of Object.keys(games)) {
		const game = games[guild];
		if (game.started) {
			game.countries.forEach(c => {
				if (c.pid) {
					c.money += ((c.industry / 20) - (c.tank * client.tankUpkeep[guild] + c.army * client.armyUpkeep[guild]));
					//console.log(`${c.country} has gained $${c.industry / 20} and lost $$(c.tank * client.tankUpkeep[guild] + c.army * client.armyUpkeep[guild]) resulting in a total of ((c.industry / 20) - (c.tank * client.tankUpkeep[guild] + c.army * client.armyUpkeep[guild]))`);
				}
				else {
					c.money += ((c.industry / 20) - (c.tank * client.tankUpkeep[guild] + c.army * client.armyUpkeep[guild]));
					aiSpend(c, guild, client); // NEW
				}
			});
		} else {
			console.log('Game not started in this server!');
		}
	}
	client.interval = Date.now();
}, 1000 * 60 * 60 * settings.moneyIntervalInHours);

function aiSpend(country, guild, client) {
    const tankCost = client.tankCost[guild] || 20;
    const armyCost = 5; 
    const industryCost = 10;

    // Get the server's priorities, or use a default if none are set.
    const priorities = 
    country.aiPriorities || 
    client.aiPriorities[guild] || 
    { army: 50, industry: 40, tank: 10 };
    let moneyToSpend = country.money;

    // --- SPENDING PHASE ---
    // The order here matters. It will spend on army first, then industry, then tank.
    
    // 1. army spend
    const armyBudget = moneyToSpend * (priorities.army / 100);
    const numToBuyArmy = Math.floor(armyBudget / armyCost);
    if (numToBuyArmy > 0) {
        country.army += numToBuyArmy;
        country.money -= numToBuyArmy * armyCost;
    }

    // 2. buy ind
    // country.money will be lower 
    const industryBudget = country.money * (priorities.industry / 100);
    const numToBuyIndustry = Math.floor(industryBudget / industryCost);
    if (numToBuyIndustry > 0) {
        country.industry += numToBuyIndustry * 20; 
        country.money -= numToBuyIndustry * industryCost;
    }
    
    // 3. yummy tankz
    const tankBudget = country.money * (priorities.tank / 100);
    const numToBuyTanks = Math.floor(tankBudget / tankCost);
    if (numToBuyTanks > 0) {
        country.tank += numToBuyTanks;
        country.money -= numToBuyTanks * tankCost;
    }
}

module.exports.aiSpend = aiSpend;


//SaveGame Manager
setInterval(async () => {
	for (const guild of Object.keys(games)) {
		const game = games[guild];
		if (game.started) {
			const saveObj = { others: {}, game: [] };
			saveObj.game = game.countries;
			saveObj.others = { started: client.gameStart[guild], yearStart: client.yearStart[guild], tankCost: client.tankCost[guild], tankUpkeep: client.tankUpkeep[guild], armyUpkeep: client.armyUpkeep[guild], minutesPerMonth: client.minutesPerMonth[guild] };
			//!! Please create the folder saves or this will error
			fs.writeFileSync(`./saves/${guild}.json`, JSON.stringify(saveObj));
			console.log(`Saved game in ${guild}`);
		}
	}
}, 1000 * 60 * settings.saveGameInMinutes);

// Track last processed paycheck month for each guild
client.lastPaycheckMonth = {};

// Monthly paycheck trigger
setInterval(async () => {
	for (const guildId of Object.keys(games)) {
		const game = games[guildId];
		if (!game.started) continue;

		const startYear = parseInt(client.yearStart[guildId]);
		const msDiff = Date.now() - client.gameStart[guildId];
		const minutesPerMonth = client.minutesPerMonth[guildId];
		const monthsPassed = Math.floor(msDiff / (1000 * 60 * Number(minutesPerMonth)));

		const currentMonthIndex = monthsPassed % 12;
		const quarterMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct (0-based index)

		if (quarterMonths.includes(currentMonthIndex)) {
			// Only fire once per transition
			if (client.lastPaycheckMonth[guildId] !== currentMonthIndex) {
				console.log(`Triggering paycheck for guild ${guildId} in month index ${currentMonthIndex}`);

				// Give paychecks
				game.countries.forEach(c => {
					if (c.pid) {
						c.money += (c.industry / 20) - (c.tank * client.tankUpkeep[guildId] + c.army * client.armyUpkeep[guildId]);
					} else {
						c.money += (c.industry / 20) - (c.tank * client.tankUpkeep[guildId] + c.army * client.armyUpkeep[guildId]);
						aiSpend(c, guildId, client);
					}
				});

				client.lastPaycheckMonth[guildId] = currentMonthIndex; // remember we paid
			}
		} else {
			// Reset so next quarter month will trigger properly
			client.lastPaycheckMonth[guildId] = null;
		}
	}
}, 1000 * 60); // check every minute


//Commands handler
const files = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = {};
files.forEach(file => {
	commands[file.slice(0, -3)] = require(`./commands/${file}`);
});

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
});

client.on('interactionCreate', async interaction => {
	if (!interaction.member) return;
	try {
		if (!games[interaction.guild.id]) games[interaction.guild.id] = new Game();
		const game = games[interaction.guild.id];
		if (interaction.isCommand()) {
			const command = commands[interaction.commandName];
			if (command?.interaction) {
				await command.interaction(interaction, game, Country, client);
			}
		} else if (interaction.isButton()) {
			const command = commands[interaction.customId.split('-')[0]];
			if (command?.button) {
				await command.button(interaction);
			}
		}
	} catch (err) {
		const err_payload = { content: `There was an error while executing this command!\n${err}`, ephemeral: true };
		console.log(err);
		if (interaction.replied || interaction.deferred) interaction.followUp(err_payload);
		else await interaction.reply(err_payload);
	}
});

client.on('messageCreate', async msg => {
	if (!msg.member) return;
	if (msg.author.bot) return;
	try {
	} catch (err) {
		console.log(err);
		await msg.reply({ content: `There was an error while executing this command!\n${err}` });
	}
});


client.login(settings.token);
