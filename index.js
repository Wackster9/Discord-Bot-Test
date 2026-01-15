const djs = require('discord.js');
const fs = require('fs');
const client = new djs.Client({
	intents: ['Guilds', 'GuildMessages', 'MessageContent'].map(r => djs.IntentsBitField.Flags[r]),
});
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
        this.attackBuff = 1.0;
        this.defenseBuff = 1.0;
        this.aiPriorities = null; 
	    this.tempAttackBuffs = [];
        this.tempDefenseBuffs = []; 
    }

	getWarScore(armyOverride = null) {
        // If an override is provided, use it. Otherwise, default to full army.
        const armyVal = (armyOverride !== null && armyOverride !== undefined) ? armyOverride : this.army;
		return armyVal + Math.floor(armyVal * (this.tank / 50));
	}

    static calculateWinChance(attacker, defender, attackingArmySize = null) {
        const totalAttackBuff = attacker.tempAttackBuffs.reduce((total, buff) => total * buff.value, attacker.attackBuff);
        
        // Pass the attackingArmySize to getWarScore
        const attackerScore = attacker.getWarScore(attackingArmySize) * totalAttackBuff;
        
        const totalDefenseBuff = defender.tempDefenseBuffs.reduce((total, buff) => total * buff.value, defender.defenseBuff);
        
        // Defender always uses full army (pass null)
        const defenderScore = defender.getWarScore() * 1.2 * totalDefenseBuff;

        if (defenderScore <= 0) return 0.99;
        const ratio = attackerScore / defenderScore;
        const MAX_WIN_CHANCE = 0.96;
        const MIDPOINT = 0.50;
        const STEEPNESS = 0.8;
        const spread = MAX_WIN_CHANCE - MIDPOINT;
        let winChance = MIDPOINT + spread * (2 / Math.PI) * Math.atan(STEEPNESS * (ratio - 1));
        return Math.max(1 - MAX_WIN_CHANCE, Math.min(MAX_WIN_CHANCE, winChance));
    }

	static getWarResult(attacker, defender, attackingArmySize) {
        // Pass the army size down the chain
        const attackerWinChance = Country.calculateWinChance(attacker, defender, attackingArmySize);
        const rng = Math.random();
        
        const atkLoses = attacker.applyattackerWarCasualties(attacker, defender, attackingArmySize);
        const defLoses = defender.applydefenderWarCasualties(defender, attacker, attackingArmySize);
        
        return {
            winner: rng < attackerWinChance ? attacker : defender,
            loser: rng < attackerWinChance ? defender : attacker,
            atkLoses,
            defLoses,
            winChance: (attackerWinChance * 100).toFixed(1)
        };
    }

	applyattackerWarCasualties(attacker, defender, armyInBattle) {
        // Use the specific army size if provided, otherwise full army
        const currentArmy = armyInBattle || this.army;

		const attackerScore = attacker.getWarScore(currentArmy);
		const defenderScore = defender.getWarScore() * 1.2;
		
        let casualties;
		if (attackerScore / defenderScore < 1) {
			casualties = Math.floor(Math.random() * 0.07 * currentArmy + 0.1 * currentArmy);
		} else {
			casualties = Math.floor(Math.random() * 0.07 * currentArmy + 0.1 * currentArmy * ((0.8) / (attackerScore / defenderScore)));
		}
        
		if (casualties < 1) casualties = 1;
        // Cap casualties at the amount sent to battle
        if (casualties > currentArmy) casualties = currentArmy;

		this.army -= casualties;
		return casualties;
	}

	applydefenderWarCasualties(defender, attacker, attackingArmySize) {
        // Defender calculation relies on Attacker's score using the SENT army
		const attackerScore = attacker.getWarScore(attackingArmySize);
		const defenderScore = defender.getWarScore() * 1.2;
		
        let casualties;
        // Defender uses full army (this.army)
		if (defenderScore / attackerScore < 1) {
			casualties = Math.floor(Math.random() * 0.04 * this.army + 0.1 * this.army);
		} else {
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
		if (c) { c.pid = pid; c.active = true; return c; }
	}
	getCountry(country) {
		if (!isNaN(country)) return this.countries[country - 1];
				return this.countries.find(c => c.country.toLowerCase() === country.toLowerCase());
	}
	abandonCountry(pid) {
		const c = this.countries.find(c => c.pid === pid && c.active);
		if (c) { c.pid = ''; return c; }
	}
	getPlayer(id) {
		return this.countries.find(c => c.pid === id && c.active);
	}
}

const games = {};

function aiSpend(country, guild, client) {
    const tankCost = client.tankCost[guild] || 20;
    const armyCost = 5; 
    const industryCost = 10;
    const priorities = country.aiPriorities || client.aiPriorities[guild] || { army: 50, industry: 40, tank: 10 };
    let moneyToSpend = country.money;
    const armyBudget = moneyToSpend * (priorities.army / 100);
    const numToBuyArmy = Math.floor(armyBudget / armyCost);
    if (numToBuyArmy > 0) {
        country.army += numToBuyArmy;
        country.money -= numToBuyArmy * armyCost;
    }
    const industryBudget = country.money * (priorities.industry / 100);
    const numToBuyIndustry = Math.floor(industryBudget / industryCost);
    if (numToBuyIndustry > 0) {
        country.industry += numToBuyIndustry * 20; 
        country.money -= numToBuyIndustry * industryCost;
    }
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
			fs.writeFileSync(`./saves/${guild}.json`, JSON.stringify(saveObj));
			console.log(`Saved game in ${guild}`);
		}
	}
}, 1000 * 60 * settings.saveGameInMinutes);

// Track last processed paycheck month for each guild
client.lastPaycheckMonth = {};

// Monthly paycheck trigger
// Monthly paycheck trigger
setInterval(async () => {
	for (const guildId of Object.keys(games)) {
		const game = games[guildId];
		if (!game || !game.started || !client.gameStart[guildId]) continue;

		const msDiff = Date.now() - client.gameStart[guildId];
		const minutesPerMonth = client.minutesPerMonth[guildId];
		const monthsPassed = Math.floor(msDiff / (1000 * 60 * Number(minutesPerMonth)));

		const currentMonthIndex = monthsPassed % 12;
		const quarterMonths = [0, 3, 6, 9]; 

		if (quarterMonths.includes(currentMonthIndex)) {
			if (client.lastPaycheckMonth[guildId] !== currentMonthIndex) {
				console.log(`Triggering paycheck for guild ${guildId} in month index ${currentMonthIndex}`);
                
                const events = client.economicEvents[guildId] || [];

                game.countries.forEach(c => {
                    const basePaycheck = (c.industry / 20) - (c.tank * (client.tankUpkeep[guildId] || 0) + c.army * (client.armyUpkeep[guildId] || 0));
                    
                    // --- CHANGED TO ADDITIVE LOGIC ---
                    let totalPercentChange = 0; // Start at 0 change
                    
                    events.forEach(event => {
                        const isCountryInList = event.countries.includes(c.country);
                        const shouldBeAffected = event.isExclusionList ? !isCountryInList : isCountryInList;
                        
                        if (shouldBeAffected) { 
                            // Add the modifiers together. 
                            // e.g. -0.5 (Tax) + -0.5 (Sanctions) = -1.0
                            totalPercentChange += event.modifier; 
                        }
                    });

                    // Base is 1.0 (100%). Add the total change.
                    const finalModifier = 1.0 + totalPercentChange;
                    // ---------------------------------

					if (c.country === 'Test') { 
                        console.log(`[DEBUG] Country: ${c.country}`);
                        console.log(`[DEBUG] Base Paycheck: ${basePaycheck}`);
                        console.log(`[DEBUG] Total Change: ${totalPercentChange}`);
                        console.log(`[DEBUG] Final Modifier: ${finalModifier}`);
                    }
                    
                    c.money += basePaycheck * finalModifier;
                    if (!c.pid) { aiSpend(c, guildId, client); }
                });

                if (events.length > 0) {
                    events.forEach(event => event.paychecksRemaining--);
                    client.economicEvents[guildId] = events.filter(event => event.paychecksRemaining > 0);
                }  
				client.lastPaycheckMonth[guildId] = currentMonthIndex;
			}
		} else {
			client.lastPaycheckMonth[guildId] = null;
		}
	}
}, 1000 * 60);
//Commands handler
const files = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = {};
files.forEach(file => {
	commands[file.slice(0, -3)] = require(`./commands/${file}`);
});

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	await require('./deploy-commands.js')(client);
	client.gameStart = {};
	client.yearStart = {};
	client.tankCost = {};
	client.tankUpkeep = {};
	client.armyUpkeep = {};
	client.minutesPerMonth = {};
    client.aiPriorities = {};
    client.economicEvents = {}; 
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
	try { } catch (err) {
		console.log(err);
		await msg.reply({ content: `There was an error while executing this command!\n${err}` });
	}
});

client.login(settings.token); 
