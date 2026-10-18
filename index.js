const djs = require('discord.js');
const fs = require('fs');
const client = new djs.Client({
	intents: ['Guilds', 'GuildMessages', 'MessageContent'].map(r => djs.IntentsBitField.Flags[r]),
});
const settings = require('./settings.json');


// Channel where the bot's interaction responses will be forwarded.
// Replace this with the ID of the channel you want to use for bot logs.
const BOT_LOG_CHANNEL_ID = '1561481912189456524';
const LOGGED_COMMANDS = [
	'forcewar',
	'war',
	'create-front',
	'add-army',
	'add-tanks',
	'withdraw-army',
	'withdraw-tanks',
	'send-army',
	'send-industry',
	'send-money',
	'send-tank',
	'join-front',
];
async function logBotMessage(interaction, message, action) {
	if (!BOT_LOG_CHANNEL_ID || BOT_LOG_CHANNEL_ID === 'PUT_BOT_LOG_CHANNEL_ID_HERE') return;
	if (!LOGGED_COMMANDS.includes(interaction.commandName)) return;
	if (!interaction.guildId) return;
	if (message?.channelId === BOT_LOG_CHANNEL_ID) return;


	try {
		const logChannel = await interaction.client.channels.fetch(BOT_LOG_CHANNEL_ID);
		if (!logChannel || !logChannel.isTextBased()) return;

		const commandName = interaction.commandName
			? ` \`/${interaction.commandName}\``
			: '';
		const sourceChannel = interaction.channelId
			? `<#${interaction.channelId}>`
			: 'Unknown channel';
		const user = interaction.user ? ` • ${interaction.user.tag}` : '';

		await logChannel.send(
			`**Bot ${action}**${commandName} in ${sourceChannel}${user}`
		);

		if (message) {
			const isEphemeral = message.flags?.has(djs.MessageFlags.Ephemeral);

			if (!isEphemeral && typeof message.forward === 'function') {
				await message.forward(logChannel);
				return;
			}

			const payload = {};
			if (message.content) payload.content = message.content;
			if (message.embeds?.length) payload.embeds = message.embeds.map(embed => embed.toJSON());

			if (message.attachments?.size) {
				payload.files = message.attachments.map(attachment => ({
					attachment: attachment.url,
					name: attachment.name || undefined
				}));
			}

			if (payload.content || payload.embeds?.length || payload.files?.length) {
				await logChannel.send(payload);
			}
		}
	} catch (err) {
		console.error('Failed to log bot message:', err);
	}
}

function createLoggedInteraction(interaction) {
	return new Proxy(interaction, {
		get(target, property, receiver) {
			if (property === 'reply' || property === 'editReply' || property === 'followUp') {
				return async (...args) => {
					const result = await target[property](...args);
					let message = result;

					// reply() may not return a Message depending on discord.js version/options.
					if (!message || typeof message.forward !== 'function') {
						try {
							message = await target.fetchReply();
						} catch (err) {
							console.error('Could not fetch bot message for logging:', err);
						}
					}

					await logBotMessage(
						target,
						message,
						property === 'followUp' ? 'follow-up' : property === 'editReply' ? 'reply update' : 'reply'
					);

					return result;
				};
			}

			return Reflect.get(target, property, receiver);
		}
	});
}

class Country {
	constructor(country, industry, army, tank, money, type, flag) {
		this.country = country;
		this.pid = '';
		this.industry = industry;
		this.army = army;
		this.tank = tank;
		this.money = money;
		this.type = type;
		this.updateHP();
		this.hp = this.mhp;
		this.flag = flag || '🏳️';
		this.active = true;
		this.attackBuff = 1.0;
		this.defenseBuff = 1.2;
		this.aiPriorities = null;
		this.tempAttackBuffs = [];
		this.tempDefenseBuffs = [];
		this.assignedArmy = 0;
		this.assignedTanks = 0;
	}

	updateHP() {
		if (this.type == "Superpowers") this.mhp = 15;
		else if (this.type == "Major Powers") this.mhp = 10;
		else if (this.type == "Regional Powers") this.mhp = 7;
		else if (this.type == "Medium Powers") this.mhp = 6;
		else if (this.type == "Minor Powers") this.mhp = 5;
		else if (this.type == "Small Powers") this.mhp = 4;
		else if (this.type == "Insignificant Powers") this.mhp = 3;
		else if (this.type == "Irrelevant Powers") this.mhp = 2;
		else if (this.type == "Microstates") this.mhp = 1;
		else this.mhp = -1;
	}

	getWarScore(armyOverride = null) {
		const armyVal = (armyOverride !== null && armyOverride !== undefined) ? armyOverride : this.army;
		return armyVal + Math.floor(armyVal * (this.tank / 50));
	}

	distributeToFronts(game) {
		let count = 0;
		let enemyScores = [];

		game.fronts.forEach(front => {
			front.attackers.forEach(country => {
				if (country.country === this.country) {
					count++;
					this.assignedArmy -= front.attackerArmies[this.country] || 0;
					front.attackerArmies[this.country] = 0;

					let totArmy = 0;
					let totTanks = 0;

					for (const num of Object.values(front.defenderArmies))
						totArmy += num;

					for (const num of Object.values(front.defenderTanks))
						totTanks += num;

					enemyScores.push(totArmy * (1 + totTanks / 50))
				}
			})

			front.defenders.forEach(country => {
				if (country.country === this.country) {
					count++;
					this.assignedArmy -= front.defenderArmies[this.country] || 0;
					front.defenderArmies[this.country] = 0;

					let totArmy = 0;
					let totTanks = 0;

					for (const num of Object.values(front.attackerArmies))
						totArmy += num;

					for (const num of Object.values(front.attackerTanks))
						totTanks += num;

					enemyScores.push(totArmy * (1 + totTanks / 50))
				}
			})
		})

		let total = 0;

		for (const score of enemyScores) {
			total += score;
		}

		if (total > 0) {
			let ratios = [];

			for (const score of enemyScores) {
				ratios.push((score / total))
			}

			let count2 = -1;

			game.fronts.forEach(front => {
				front.attackers.forEach(country => {
					if (country.country === this.country) {
						count2++;
						this.assignedArmy += Math.floor(this.army * ratios[count2]);
						front.attackerArmies[this.country] = Math.floor(this.army * ratios[count2]);
					}
				})

				front.defenders.forEach(country => {
					if (country.country === this.country) {
						count2++;
						this.assignedArmy += Math.floor(this.army * ratios[count2]);
						front.defenderArmies[this.country] = Math.floor(this.army * ratios[count2]);
					}
				})
			})

			game.fronts.forEach(front => {
				front.attackers.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks -= front.attackerTanks[this.country] || 0;
						front.attackerTanks[this.country] = 0;
					}
				})

				front.defenders.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks -= front.defenderTanks[this.country] || 0;
						front.defenderTanks[this.country] = 0;
					}
				})
			})

			game.fronts.forEach(front => {
				front.attackers.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks += Math.floor(this.tank / count);
						front.attackerTanks[this.country] = Math.floor(this.tank / count);
					}
				})

				front.defenders.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks += Math.floor(this.tank / count);
						front.defenderTanks[this.country] = Math.floor(this.tank / count);
					}
				})
			})
		}

		else {
			game.fronts.forEach(front => {
				front.attackers.forEach(country => {
					if (country.country === this.country) {
						this.assignedArmy += Math.floor(this.army / count);
						front.attackerArmies[this.country] = Math.floor(this.army / count);
					}
				})

				front.defenders.forEach(country => {
					if (country.country === this.country) {
						this.assignedArmy += Math.floor(this.army / count);
						front.defenderArmies[this.country] = Math.floor(this.army / count);
					}
				})
			})

			game.fronts.forEach(front => {
				front.attackers.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks -= front.attackerTanks[this.country] || 0;
						front.attackerTanks[this.country] = 0;
					}
				})

				front.defenders.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks -= front.defenderTanks[this.country] || 0;
						front.defenderTanks[this.country] = 0;
					}
				})
			})

			game.fronts.forEach(front => {
				front.attackers.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks += Math.floor(this.tank / count);
						front.attackerTanks[this.country] = Math.floor(this.tank / count);
					}
				})

				front.defenders.forEach(country => {
					if (country.country === this.country) {
						this.assignedTanks += Math.floor(this.tank / count);
						front.defenderTanks[this.country] = Math.floor(this.tank / count);
					}
				})
			})
		}
	}
}

class Front {
	constructor(game, name, attackers = [], defenders = [], atkleader, defleader) {
		this.game = game;
		this.name = name;
		this.attackers = attackers;
		this.defenders = defenders;
		this.atkleader = atkleader
		this.defleader = defleader
		this.attackerArmies = {};
		this.defenderArmies = {};
		this.attackerTanks = {};
		this.defenderTanks = {};
		this.active = true;
	}

	static calculateWinChance(atk, def) {
		if (def <= 0) return 0.99;

		const ratio = atk / def;

		const MIN_WIN_CHANCE = 0.01;
		const MAX_WIN_CHANCE = 0.99;
		const POWER = 1.5;

		let winChance;

		if (ratio >= 1) {
			winChance = 0.50 + 0.49 * (1 - Math.pow(1 / ratio, POWER));
		} else {
			winChance = 0.50 * Math.pow(ratio, POWER);
		}

		return Math.max(MIN_WIN_CHANCE, Math.min(MAX_WIN_CHANCE, winChance));
	}

	getBattleResult(attacker, defender) {
		let attackerCountry;
		let defenderCountry;

		if (this.attackers.some(country => country.country.toLowerCase() === attacker.toLowerCase())) {
			attackerCountry = this.attackers.find(country => country.country.toLowerCase() === attacker.toLowerCase());
			defenderCountry = this.defenders.find(country => country.country.toLowerCase() === defender.toLowerCase());

		} else if (this.defenders.some(country => country.country.toLowerCase() === attacker.toLowerCase())) {
			attackerCountry = this.defenders.find(country => country.country.toLowerCase() === attacker.toLowerCase());
			defenderCountry = this.attackers.find(country => country.country.toLowerCase() === defender.toLowerCase());

		} else {
			return null;
		}

		if (!defenderCountry) {
			return null;
		}

		let totalAttackerArmy = 0;
		let totalAttackerTanks = 0;
		let totalAttackerBuff = [];

		let totalDefenderArmy = 0;
		let totalDefenderTanks = 0;
		let totalDefenderBuff = [];

		if (this.attackers.includes(attackerCountry)) {

			for (const country of this.attackers) {
				const army = this.attackerArmies[country.country] || 0;
				const tanks = this.attackerTanks[country.country] || 0;

				totalAttackerArmy += army;
				totalAttackerTanks += tanks;

				if (country.tempAttackBuffs.length > 0 && country.tempAttackBuffs[0].uses > 0) {
					totalAttackerBuff.push({
						modifier: country.tempAttackBuffs[0].value,
						warscore: (army * (1 + tanks / 50))
					});

					country.tempAttackBuffs[0].uses -= 1;

					if (country.tempAttackBuffs[0].uses == 0)
						country.tempAttackBuffs = [];
				}

				else {
					totalAttackerBuff.push({
						modifier: 1 * country.attackBuff,
						warscore: (army * (1 + tanks / 50))
					});
				}
			}

			for (const country of this.defenders) {
				const army = this.defenderArmies[country.country] || 0;
				const tanks = this.defenderTanks[country.country] || 0;

				totalDefenderArmy += army;
				totalDefenderTanks += tanks;

				if (country.tempDefenseBuffs.length > 0 && country.tempDefenseBuffs[0].uses > 0) {
					totalDefenderBuff.push({
						modifier: country.tempDefenseBuffs[0].value,
						warscore: (army * (1 + tanks / 50))
					});

					country.tempDefenseBuffs[0].uses -= 1;

					if (country.tempDefenseBuffs[0].uses == 0)
						country.tempDefenseBuffs = [];
				}

				else {
					totalDefenderBuff.push({
						modifier: 1 * country.defenseBuff,
						warscore: (army * (1 + tanks / 50))
					});
				}
			}

		} else {

			for (const country of this.defenders) {
				const army = this.defenderArmies[country.country] || 0;
				const tanks = this.defenderTanks[country.country] || 0;

				totalAttackerArmy += army;
				totalAttackerTanks += tanks;

				if (country.tempAttackBuffs.length > 0 && country.tempAttackBuffs[0].uses > 0) {
					totalAttackerBuff.push({
						modifier: country.tempAttackBuffs[0].value,
						warscore: (army * (1 + tanks / 50))
					});

					country.tempAttackBuffs[0].uses -= 1;

					if (country.tempAttackBuffs[0].uses == 0)
						country.tempAttackBuffs = [];
				}

				else {
					totalAttackerBuff.push({
						modifier: 1 * country.attackBuff,
						warscore: (army * (1 + tanks / 50))
					});
				}
			}

			for (const country of this.attackers) {
				const army = this.attackerArmies[country.country] || 0;
				const tanks = this.attackerTanks[country.country] || 0;

				totalDefenderArmy += army;
				totalDefenderTanks += tanks;

				if (country.tempDefenseBuffs.length > 0 && country.tempDefenseBuffs[0].uses > 0) {
					totalDefenderBuff.push({
						modifier: country.tempDefenseBuffs[0].value,
						warscore: (army * (1 + tanks / 50))
					});

					country.tempDefenseBuffs[0].uses -= 1;

					if (country.tempDefenseBuffs[0].uses == 0)
						country.tempDefenseBuffs = [];
				}

				else {
					totalDefenderBuff.push({
						modifier: 1 * country.defenseBuff,
						warscore: (army * (1 + tanks / 50))
					});
				}
			}
		}

		let numerator = 0;
		let denominator = 0;

		for (let i = 0; i < totalAttackerBuff.length; i++) {
			numerator += totalAttackerBuff[i].modifier * totalAttackerBuff[i].warscore;
			denominator += totalAttackerBuff[i].warscore;
		}

		let calculatedAttackBuff = (numerator) / (denominator);

		numerator = 0, denominator = 0;

		for (let i = 0; i < totalDefenderBuff.length; i++) {
			numerator += totalDefenderBuff[i].modifier * totalDefenderBuff[i].warscore;
			denominator += totalDefenderBuff[i].warscore;
		}

		let calculatedDefenseBuff = (numerator) / (denominator)

		let atkWarscore = totalAttackerArmy * (1 + totalAttackerTanks / 50) * calculatedAttackBuff;
		let defWarscore = totalDefenderArmy * (1 + totalDefenderTanks / 50) * calculatedDefenseBuff;

		const attackerWinChance = Front.calculateWinChance(atkWarscore, defWarscore);

		const rng = Math.random();

		const winner = rng < attackerWinChance ? attackerCountry : defenderCountry;
		const loser = rng < attackerWinChance ? defenderCountry : attackerCountry;

		const closeness = Math.abs(attackerWinChance - rng);
		const casualties = this.applyCasualties(attackerCountry, defenderCountry, winner, closeness);

		return {
			attacker: attackerCountry,
			defender: defenderCountry,
			winner,
			loser,
			atkLoses: casualties.atkLoses,
			defLoses: casualties.defLoses,
			winChance: (attackerWinChance * 100).toFixed(1)
		};
	}

	applyCasualties(attacker, defender, victor, closeness) {
		const victorIsAttacker = this.attackers.some(
			country => country === victor
		);

		let atkCasualties;
		let defCasualties;

		if (victorIsAttacker) {
			atkCasualties = 0.08;
			defCasualties = 0.12;

			defender.hp--;

		} else {
			atkCasualties = 0.13;
			defCasualties = 0.07;

			attacker.hp--;

			if (defender.hp < defender.mhp)
				defender.hp++;
		}

		if (closeness <= 0.05) {

			if (victorIsAttacker) {
				atkCasualties *= 1.2;
				defCasualties *= (1 / 1.2);
			} else {
				atkCasualties *= (1 / 1.2);
				defCasualties *= 1.2;
			}

		} else if (closeness > 0.2) {

			if (victorIsAttacker) {
				atkCasualties *= 0.9;
				defCasualties *= (1 / 0.9);
			} else {
				atkCasualties *= (1 / 0.9);
				defCasualties *= 0.9;
			}
		}

		let atkLoses = 0;
		let defLoses = 0;

		for (const country of this.attackers) {
			const army = this.attackerArmies[country.country] || 0;
			const casualties = Math.round(army * atkCasualties);

			country.army -= casualties;
			country.assignedArmy -= casualties;
			this.attackerArmies[country.country] -= casualties;

			atkLoses += casualties;
		}

		for (const country of this.defenders) {
			const army = this.defenderArmies[country.country] || 0;
			const casualties = Math.round(army * defCasualties);

			country.army -= casualties;
			country.assignedArmy -= casualties;
			this.defenderArmies[country.country] -= casualties;

			defLoses += casualties;
		}

		return {
			atkLoses,
			defLoses
		};
	}
}

class Game {
	constructor() {
		this.countries = require('./countries/countries-1933.js').countries.map(c => new Country(...c));
		this.started = false;
		this.fronts = [];
	}

	start(countriesFile) {
		this.countries = require(`./countries/${countriesFile}`).countries.map(c => new Country(...c));
		this.started = true;
	}

	end() {
		this.started = false;
		this.countries = require('./countries/countries-1933.js').countries.map(c => new Country(...c));
		this.fronts = [];
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
		if (!country) return null;
		if (!isNaN(country)) return this.countries[country - 1];
		return this.countries.find(c => c.country.toLowerCase() === country.toLowerCase());
	}

	getFront(front) {
		if (!front) return null;
		if (!isNaN(front)) return this.fronts[front - 1];
		return this.fronts.find(f => f.name.toLowerCase() === front.toLowerCase());
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

	aiSpend(country, guild, client) {
		const tankCost = client.tankCost[guild] || 20;
		const armyCost = 5;
		const industryCost = 10;

		const priorities = country.aiPriorities ||
			client.aiPriorities[guild] ||
			{ army: 30, industry: 45, tank: 10, money: 15 };

		let moneyToSpend = country.money;

		const armyBudget = moneyToSpend * (priorities.army / 100);
		const industryBudget = moneyToSpend * (priorities.industry / 100);
		const tankBudget = moneyToSpend * (priorities.tank / 100);

		const numToBuyArmy = Math.floor(armyBudget / armyCost);

		if (numToBuyArmy > 0) {
			country.army += numToBuyArmy;
			country.money -= numToBuyArmy * armyCost;
		}

		const numToBuyIndustry = Math.floor(industryBudget / industryCost);

		if (numToBuyIndustry > 0) {
			country.industry += numToBuyIndustry * 20;
			country.money -= numToBuyIndustry * industryCost;
		}

		const numToBuyTanks = Math.floor(tankBudget / tankCost);

		if (numToBuyTanks > 0) {
			country.tank += numToBuyTanks;
			country.money -= numToBuyTanks * tankCost;
		}

		this.countries.forEach(country => {
			if (country.pid == '') {
				country.distributeToFronts(this);
			}
		});
	}
}

const games = {};

// SaveGame Manager
setInterval(async () => {
	for (const guild of Object.keys(games)) {
		const game = games[guild];

		if (game.started) {
			const saveObj = {
				others: {},
				game: [],
				fronts: []
			};

			saveObj.game = game.countries;

			saveObj.fronts = game.fronts.map(front => ({
				name: front.name,
				attackers: front.attackers.map(c => c.country),
				defenders: front.defenders.map(c => c.country),
				atkleader: front.atkleader,
				defleader: front.defleader,
				attackerArmies: front.attackerArmies,
				defenderArmies: front.defenderArmies,
				attackerTanks: front.attackerTanks,
				defenderTanks: front.defenderTanks,
				active: front.active
			}));

			saveObj.others = {
				started: client.gameStart[guild],
				yearStart: client.yearStart[guild],
				tankCost: client.tankCost[guild],
				tankUpkeep: client.tankUpkeep[guild],
				armyUpkeep: client.armyUpkeep[guild],
				minutesPerMonth: client.minutesPerMonth[guild]
			};

			fs.writeFileSync(
				`./saves/${guild}.json`,
				JSON.stringify(saveObj)
			);

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

		if (!game || !game.started || !client.gameStart[guildId]) continue;

		const msDiff = Date.now() - client.gameStart[guildId];
		const minutesPerMonth = client.minutesPerMonth[guildId];
		const monthsPassed = Math.floor(
			msDiff / (1000 * 60 * Number(minutesPerMonth))
		);

		const currentMonthIndex = monthsPassed % 12;
		const quarterMonths = [0, 4, 8];

		if (quarterMonths.includes(currentMonthIndex)) {
			if (client.lastPaycheckMonth[guildId] !== currentMonthIndex) {

				console.log(
					`Triggering paycheck for guild ${guildId} in month index ${currentMonthIndex}`
				);

				const events = client.economicEvents[guildId] || [];

				game.countries.forEach(c => {
					const basePaycheck =
						(c.industry / 20) -
						(
							c.tank * (client.tankUpkeep[guildId] || 0) +
							c.army * (client.armyUpkeep[guildId] || 0)
						);

					let totalPercentChange = 0;

					events.forEach(event => {
						const isCountryInList =
							event.countries.includes(c.country);

						const shouldBeAffected =
							event.isExclusionList
								? !isCountryInList
								: isCountryInList;

						if (shouldBeAffected) {
							totalPercentChange += event.modifier;
						}
					});

					const finalModifier = 1.0 + totalPercentChange;

					if (c.country === 'Test') {
						console.log(`[DEBUG] Country: ${c.country}`);
						console.log(`[DEBUG] Base Paycheck: ${basePaycheck}`);
						console.log(`[DEBUG] Total Change: ${totalPercentChange}`);
						console.log(`[DEBUG] Final Modifier: ${finalModifier}`);
					}

					c.money += basePaycheck * finalModifier;

					if (!c.pid) {
						game.aiSpend(c, guildId, client);
					}
				});

				if (events.length > 0) {
					events.forEach(event => event.paychecksRemaining--);
					client.economicEvents[guildId] =
						events.filter(event => event.paychecksRemaining > 0);
				}

				client.lastPaycheckMonth[guildId] = currentMonthIndex;
			}
		} else {
			client.lastPaycheckMonth[guildId] = null;
		}
	}
}, 1000 * 60);

// Commands handler
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
		if (!games[interaction.guildId]) {
			games[interaction.guildId] = new Game();
		}

		const game = games[interaction.guildId];

		if (interaction.isCommand()) {
			const command = commands[interaction.commandName];

			if (command?.interaction) {
				await command.interaction(
					createLoggedInteraction(interaction),
					game,
					Country,
					Front,
					client
				);
			}

		} else if (interaction.isButton()) {

			const command =
				commands[interaction.customId.split('-')[0]];

			if (command?.button) {
				await command.button(
					createLoggedInteraction(interaction)
				);
			}
		}

	} catch (err) {
		const err_payload = {
			content: `There was an error while executing this command!\n${err}`,
			ephemeral: true
		};

		console.log(err);

		if (interaction.replied || interaction.deferred)
			interaction.followUp(err_payload);
		else
			await interaction.reply(err_payload);
	}
});

client.on('messageCreate', async msg => {
	if (!msg.member) return;
	if (msg.author.bot) return;

	try { } catch (err) {
		console.log(err);

		await msg.reply({
			content: `There was an error while executing this command!\n${err}`
		});
	}
});

client.login(settings.token);