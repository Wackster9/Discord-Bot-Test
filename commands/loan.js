const djs = require('discord.js');

module.exports.application_command = () => {
    return new djs.SlashCommandBuilder()
        .setName('loan')
        .setDescription('Manage international loans and debt diplomacy.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('offer')
                .setDescription('Offer a loan to another country.')
                .addStringOption(option => option.setName('target').setDescription('The country you want to indebt.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The amount of cash to offer.').setRequired(true).setMinValue(1))
                .addIntegerOption(option => option.setName('interest_premium').setDescription('The percentage premium for this loan (e.g., 25 for a 25% premium).').setRequired(true).setMinValue(0).setMaxValue(100))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('request')
                .setDescription('Request a loan from another country.')
                .addStringOption(option => option.setName('target').setDescription('The country you are begging for money from.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The amount of cash you are requesting.').setRequired(true).setMinValue(1))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a pending loan offer.')
                .addStringOption(option => option.setName('id').setDescription('The ID of the loan offer to accept.').setRequired(true))
                // New optional field for the lender to set the interest
                .addIntegerOption(option => option.setName('interest_premium').setDescription('[Lender Only] Set the interest premium for a requested loan.').setRequired(false).setMinValue(0).setMaxValue(100))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('decline')
                .setDescription('Decline a pending loan offer.')
                .addStringOption(option => option.setName('id').setDescription('The ID of the loan offer to decline.').setRequired(true))
        );
};

module.exports.interaction = async (interaction, game) => {
    const subcommand = interaction.options.getSubcommand();
    const player = game.getPlayer(interaction.user.id);

    if (!player) {
        return interaction.reply({ content: 'You must control a country to engage in international finance.', ephemeral: true });
    }

    if (subcommand === 'offer') {
        const targetName = interaction.options.getString('target');
        const target = game.getCountry(targetName);
        if (!target) return interaction.reply({ content: `Target country '${targetName}' not found.`, ephemeral: true });
        if (target.country === player.country) return interaction.reply({ content: 'You cannot offer a loan to yourself.', ephemeral: true });
        if (!target.pid) return interaction.reply({ content: 'You cannot offer a loan to an unclaimed country.', ephemeral: true });

        const amount = interaction.options.getInteger('amount');
        const interestPremium = interaction.options.getInteger('interest_premium');
        
        if (player.money < amount) {
            return interaction.reply({ content: `You only have $${player.money}. You cannot offer a loan of $${amount}.`, ephemeral: true });
        }

        const proposal = {
            id: Date.now().toString(),
            type: 'offer',
            lender: player.country,
            borrower: target.country,
            principal: amount,
            totalDebt: Math.floor(amount * (1 + interestPremium / 100)),
            interestPremium: interestPremium,
            status: 'pending_borrower' // Waiting for the borrower to accept
        };

        game.loanProposals.push(proposal);

        await interaction.reply(`You have offered a loan of **$${amount}** to **${target.country}**. They will be notified. This proposal ID is \`${proposal.id}\`.`);
        
        const targetUser = await interaction.client.users.fetch(target.pid);
        if (targetUser) {
            targetUser.send(`**Loan Offer Received!**\n**${player.country}** has offered you a loan of **$${amount}** with a **${interestPremium}%** interest premium (Total Debt: **$${proposal.totalDebt}**).\nTo accept, use \`/loan accept id:${proposal.id}\`.\nTo decline, use \`/loan decline id:${proposal.id}\`.`).catch(e => console.log("Couldn't DM user."));
        }

    } else if (subcommand === 'request') {
        const targetName = interaction.options.getString('target');
        const target = game.getCountry(targetName);
        if (!target) return interaction.reply({ content: `Target country '${targetName}' not found.`, ephemeral: true });
        if (target.country === player.country) return interaction.reply({ content: 'You cannot request a loan from yourself.', ephemeral: true });
        if (!target.pid) return interaction.reply({ content: 'You cannot request a loan from an unclaimed country.', ephemeral: true });

        const amount = interaction.options.getInteger('amount');
        
        const proposal = {
            id: Date.now().toString(),
            type: 'request',
            lender: target.country,
            borrower: player.country,
            principal: amount,
            status: 'pending_lender' // Waiting for the lender to set interest and accept
        };
        
        game.loanProposals.push(proposal);

        await interaction.reply(`You have requested a loan of **$${amount}** from **${target.country}**. They will be notified. This proposal ID is \`${proposal.id}\`.`);
        
        const targetUser = await interaction.client.users.fetch(target.pid);
        if (targetUser) {
            targetUser.send(`**Loan Request Received!**\n**${player.country}** is requesting a loan of **$${amount}** from you.\nTo approve this loan, use \`/loan accept id:${proposal.id} interest_premium:<your_rate>\`.\nTo decline, use \`/loan decline id:${proposal.id}\`.`).catch(e => console.log("Couldn't DM user."));
        }

    } else if (subcommand === 'accept') {
        const proposalId = interaction.options.getString('id');
        const proposalIndex = game.loanProposals.findIndex(p => p.id === proposalId);
        if (proposalIndex === -1) return interaction.reply({ content: 'Invalid proposal ID.', ephemeral: true });

        const proposal = game.loanProposals[proposalIndex];
        const lender = game.getCountry(proposal.lender);
        const borrower = game.getCountry(proposal.borrower);

        if (proposal.status === 'pending_borrower' && player.country === proposal.borrower) {
            // Borrower is accepting an offer
            if (lender.money < proposal.principal) return interaction.reply({ content: `Unfortunately, **${lender.country}** no longer has the funds to provide this loan.`, ephemeral: true });

            lender.money -= proposal.principal;
            borrower.money += proposal.principal;
            borrower.debts[lender.country] = (borrower.debts[lender.country] || 0) + proposal.totalDebt;

            game.loanProposals.splice(proposalIndex, 1); // Remove proposal
            return interaction.reply(`✅ **Loan Accepted!** You have accepted the loan from **${lender.country}**. Your new debt to them is **$${borrower.debts[lender.country]}**.`);

        } else if (proposal.status === 'pending_lender' && player.country === proposal.lender) {
            // Lender is accepting a request
            const interestPremium = interaction.options.getInteger('interest_premium');
            if (interestPremium === null) return interaction.reply({ content: 'You must specify an `interest_premium` when approving a loan request.', ephemeral: true });

            if (lender.money < proposal.principal) return interaction.reply({ content: `You do not have enough funds to approve this loan.`, ephemeral: true });
            
            const totalDebt = Math.floor(proposal.principal * (1 + interestPremium / 100));

            lender.money -= proposal.principal;
            borrower.money += proposal.principal;
            borrower.debts[lender.country] = (borrower.debts[lender.country] || 0) + totalDebt;
            
            game.loanProposals.splice(proposalIndex, 1); // Remove proposal
            return interaction.reply(`✅ **Loan Request Approved!** You have provided a loan of **$${proposal.principal}** to **${borrower.country}** at a **${interestPremium}%** premium. They now owe you **$${borrower.debts[lender.country]}**.`);

        } else {
            return interaction.reply({ content: 'You are not authorized to accept this loan, or it is not in a valid state.', ephemeral: true });
        }

    } else if (subcommand === 'decline') {
        const proposalId = interaction.options.getString('id');
        const proposalIndex = game.loanProposals.findIndex(p => p.id === proposalId);
        if (proposalIndex === -1) return interaction.reply({ content: 'Invalid proposal ID.', ephemeral: true });

        const proposal = game.loanProposals[proposalIndex];
        
        // Only the lender or borrower can decline
        if (player.country !== proposal.lender && player.country !== proposal.borrower) {
            return interaction.reply({ content: 'You are not a part of this loan proposal.', ephemeral: true });
        }

        game.loanProposals.splice(proposalIndex, 1); // Remove proposal
        return interaction.reply(`❌ **Loan Declined.** The loan proposal with ID \`${proposalId}\` has been declined.`);
    }
};