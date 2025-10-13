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

	getWarScore() {
		return this.army + Math.floor(this.army * (this.tank / 50));
	}

    static calculateWinChance(attacker, defender) {
        const totalAttackBuff = attacker.tempAttackBuffs.reduce((total, buff) => total * buff.value, attacker.attackBuff);
        const attackerScore = attacker.getWarScore() * totalAttackBuff;
        const totalDefenseBuff = defender.tempDefenseBuffs.reduce((total, buff) => total * buff.value, defender.defenseBuff);
        const defenderScore = defender.getWarScore() * 1.2 * totalDefenseBuff;

        if (defenderScore <= 0) return 0.93;
        const ratio = attackerScore / defenderScore;
        const MAX_WIN_CHANCE = 0.93;
        const MIDPOINT = 0.50;
        const STEEPNESS = 0.8;
        const spread = MAX_WIN_CHANCE - MIDPOINT;
        let winChance = MIDPOINT + spread * (2 / Math.PI) * Math.atan(STEEPNESS * (ratio - 1));
        return Math.max(1 - MAX_WIN_CHANCE, Math.min(MAX_WIN_CHANCE, winChance));
    }

	static getWarResult(attacker, defender) {
        const attackerWinChance = Country.calculateWinChance(attacker, defender);
        const rng = Math.random();
        const atkLoses = attacker.applyattackerWarCasualties(attacker, defender);
        const defLoses = defender.applydefenderWarCasualties(defender, attacker);
        return {
            winner: rng < attackerWinChance ? attacker : defender,
            loser: rng < attackerWinChance ? defender : attacker,
            atkLoses,
            defLoses,
            winChance: (attackerWinChance * 100).toFixed(1)
        };
    }

	applyattackerWarCasualties(attacker, defender, casualties) {
		const attackerScore = attacker.getWarScore();
		const defenderScore = defender.getWarScore() * 1.2;
		if (attackerScore / defenderScore < 1) {
			casualties = Math.floor(Math.random() * 0.07 * this.army + 0.1 * this.army);
		} else {
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
		return 