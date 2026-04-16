// commands/loan.js
const { SlashCommandBuilder, /* other builders as needed */ } = require('discord.js');

// You can keep your individual command files or consolidate them here.
// For this example, we assume this file ONLY handles the button/modal logic.

module.exports.button = async (interaction, game) => {
    // We get the full ID, e.g., "loan-accept-a1b2c3d4"
    const [commandName, action, proposalId] = interaction.customId.split('-');

    // Find the relevant proposal in the game state
    const proposal = game.loanProposals.find(p => p.id === proposalId);

    if (!proposal) {
        return interaction.update({ content: 'This loan offer has expired or was already handled.', components: [] });
    }

    switch (action) {
        case 'accept': {
            // Logic for when a borrower accepts an offer
            const borrower = game.getCountry(proposal.borrower);
            const lender = game.getCountry(proposal.lender);

            if (interaction.user.id !== borrower.pid) {
                return interaction.reply({ content: "This is not your loan to accept.", ephemeral: true });
            }
            if (lender.money < proposal.principal) {
                return interaction.update({ content: `Loan cancelled. ${lender.country} no longer has the funds.`, components: [] });
            }

            // 1. Transfer funds
            lender.money -= proposal.principal;
            borrower.money += proposal.principal;

            // 2. Create the debt object
            if (!borrower.debts) borrower.debts = {};
            borrower.debts[lender.country] = {
                lender: lender.country,
                originalPrincipal: proposal.principal,
                currentPrincipal: proposal.principal,
                interestRate: proposal.interestRate,
                paymentRate: proposal.paymentRate,
                totalInterestPaid: 0
            };

            // 3. Clean up the proposal
            game.loanProposals = game.loanProposals.filter(p => p.id !== proposalId);

            // 4. Notify everyone and update the message
            await interaction.update({ content: `✅ **Loan Accepted!** **$${proposal.principal.toLocaleString()}** has been transferred from **${lender.country}** to **${borrower.country}**.`, components: [] });
            
            if (lender.pid) {
                const lenderUser = await interaction.client.users.fetch(lender.pid);
                lenderUser.send(`Your loan offer to **${borrower.country}** has been accepted. The funds have been transferred.`);
            }
            break;
        }
            
        case 'decline': {
            // Logic for when a user declines an offer
            const relevantPlayer = (proposal.type === 'offer') ? game.getCountry(proposal.borrower) : game.getCountry(proposal.lender);
            
            if (interaction.user.id !== relevantPlayer.pid) {
                return interaction.reply({ content: "This is not your decision to make.", ephemeral: true });
            }

            // Just clean up the proposal
            game.loanProposals = game.loanProposals.filter(p => p.id !== proposalId);

            await interaction.update({ content: '❌ **Offer Declined.**', components: [] });
            break;
        }

        // You would add other cases here, like 'approve-standard', 'propose-custom', etc.
        case 'propose-custom': {
            // Here you would show the modal to the lender
            // ...modal logic from previous instructions...
            break;
        }

        default:
            return interaction.reply({ content: 'Unknown loan action.', ephemeral: true });
    }
};

// You will also need a modal handler here for when the 'propose-custom' modal is submitted.
module.exports.modal = async (interaction, game) => {
    // ...modal submission handling logic...
}