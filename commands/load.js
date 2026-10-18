const fs = require('fs');
const djs = require('discord.js');
module.exports.interaction = async (interaction, game, Country, Front) => {
	const keep_players = interaction.options.getBoolean('load_players');
	const guildId = interaction.guild.id;
	if (!fs.existsSync(`./saves/${guildId}.json`)) return await interaction.reply('No save file found.');
	if (game.started) return await interaction.reply('Game already started. Please end the game before loading a save file.');
	await interaction.reply('Loading save file...');
	try {
		const saveData = fs.readFileSync(`./saves/${guildId}.json`, 'utf-8');
		const savedGame = JSON.parse(saveData);
		game.countries = savedGame.game.map(countryData => {

			const { country, industry, army, tank, money, type, flag } = countryData;

			const countryInstance = new Country(
				country,
				industry,
				army,
				tank,
				money,
				type,
				flag
			);

			countryInstance.active = true;

			countryInstance.assignedArmy = countryData.assignedArmy || 0;
			countryInstance.assignedTanks = countryData.assignedTanks || 0;

			if (!keep_players) {
				countryInstance.pid = '';
			} else {
				countryInstance.pid = countryData.pid;
			}

			return countryInstance;
		});
		game.fronts = savedGame.fronts.map(savedFront => {
			const attackers = savedFront.attackers
				.map(countryName => game.getCountry(countryName))
				.filter(Boolean);

			const defenders = savedFront.defenders
				.map(countryName => game.getCountry(countryName))
				.filter(Boolean);

			const atkleader = savedFront.atkleader
				? game.getCountry(savedFront.atkleader.country)
				: null;

			const defleader = savedFront.defleader
				? game.getCountry(savedFront.defleader.country)
				: null;

			const front = new Front(
				game,
				savedFront.name,
				attackers,
				defenders,
				atkleader,
				defleader
			);

			front.attackerArmies = savedFront.attackerArmies || {};
			front.defenderArmies = savedFront.defenderArmies || {};
			front.attackerTanks = savedFront.attackerTanks || {};
			front.defenderTanks = savedFront.defenderTanks || {};
			front.active = savedFront.active ?? true;

			return front;
		});
		game.started = true;
		interaction.client.gameStart[interaction.guild.id] = savedGame.others.started;
		interaction.client.yearStart[interaction.guild.id] = savedGame.others.yearStart;
		interaction.client.tankCost[interaction.guild.id] = savedGame.others.tankCost;
		interaction.client.tankUpkeep[interaction.guild.id] = savedGame.others.tankUpkeep;
		interaction.client.armyUpkeep[interaction.guild.id] = savedGame.others.armyUpkeep;
		interaction.client.minutesPerMonth[interaction.guild.id] = savedGame.others.minutesPerMonth;
		await interaction.editReply('Game loaded and started successfully! Have fun!');
	} catch (error) {
		console.error(error);
		await interaction.editReply('Failed to load the game. Please try again later.');
	}
};

module.exports.application_command = () => {
	return new djs.SlashCommandBuilder()
		.setName('load')
		.setDescription("Load a game from the server's save file.")
		.setDefaultMemberPermissions(djs.PermissionsBitField.Flags.Administrator)
		.addBooleanOption(option =>
			option.setName('load_players').setDescription('Loads the players from the save file.').setRequired(true),
		);
};
