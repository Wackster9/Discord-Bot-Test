// commands/loan.js
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require('crypto');

// This file has NO application_command. It is a UTILITY file. It is INVISIBLE to users.

// ==================================================================================
//                            BUTTON HANDLER
// ==================================================================================
module.exports.button = async (interaction, game, client) => {
    const [commandName, action, proposalId] = interaction.customId.split('-');
    const proposal = game.loanProposals.find(p => p.id === proposalId);

    if (!proposal) {
        return interaction.update({ content: 'This loan offer has expired or was already handled.', components: [] });
    }

    switch (action) {
        // Case: A borrower accepts an offer.
        case 'accept': {
            const borrower = game.getCountry(proposal.borrower);
            const lender = game.getCountry(proposal.lender);

            if (interaction.user.id !== borrower.pid) {
                return interaction.reply({ content: "This is not your loan to accept.", ephemeral: true });
            }
            if (lender.money < proposal.principal) {
                return interaction.update({ content: `Loan cancelled. ${lender.country} no longer has the funds.`, components: [] });
            }

            lender.money -= proposal.principal;
            borrower.money += proposal.principal;

            if (!borrower.debts) borrower.debts = {};
            borrower.debts[lender.country] = {
                lender: lender.country,
                originalPrincipal: proposal.principal,
                currentPrincipal: proposal.principal,
                interestRate: proposal.interestRate,
                paymentRate: proposal.paymentRate,
                totalInterestPaid: 0
            };

            game.loanProposals = game.loanProposals.filter(p => p.id !== proposalId);

            await interaction.update({ content: `✅ **Loan Accepted!** **$${proposal.principal.toLocaleString()}** has been transferred from **${lender.country}** to **${borrower.country}**.`, components: [] });

            if (lender.pid) {
                try {
                    const lenderUser = await interaction.client.users.fetch(lender.pid);
                    lenderUser.send(`Your loan offer to **${borrower.country}** has been accepted.`);
                } catch {}
            }
            break;
        }

        // Case: Anyone declines anything.
        case 'decline': {
            const playerIsBorrower = game.getPlayer(interaction.user.id)?.country === proposal.borrower;
            const playerIsLender = game.getPlayer(interaction.user.id)?.country === proposal.lender;

            if (!playerIsBorrower && !playerIsLender) {
                return interaction.reply({ content: "This is not your decision to make.", ephemeral: true });
            }
            
            game.loanProposals = game.loanProposals.filter(p => p.id !== proposalId);
            await interaction.update({ content: '❌ **Offer Declined.**', components: [] });
            break;
        }

        // Case: Lender approves a request with standard, pre-defined terms.
        case 'approvestandard': {
            // YOU MUST DEFINE "STANDARD TERMS" HERE
            const STANDARD_INTEREST_RATE = 0.05; // 5%
            const STANDARD_PAYMENT_RATE = 0.10; // 10%

            proposal.interestRate = STANDARD_INTEREST_RATE;
            proposal.paymentRate = STANDARD_PAYMENT_RATE;
            proposal.type = 'offer'; // It's now a firm offer

            // Re-route to the 'accept' logic to avoid duplicating code.
            // This is a bit of a hack, but it works. We pretend it's a new proposal.
            // First, send the confirmation to the borrower:
            const borrower = game.getCountry(proposal.borrower);
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`loan-accept-${proposal.id}`).setLabel('Accept Standard Terms').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`loan-decline-${proposal.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
            );

            await interaction.update({ content: `You have approved the loan with standard terms. Waiting for **${borrower.country}** to confirm.`, components: []});
            
            try {
                const borrowerUser = await interaction.client.users.fetch(borrower.pid);
                borrowerUser.send({
                    content: `**${proposal.lender}** has approved your loan request with standard terms (5% interest, 10% payment rate). Do you accept?`,
                    components: [row]
                });
            } catch {}
            break;
        }

        // Case: Lender wants to create a custom offer.
        case 'proposecustom': {
            const lender = game.getCountry(proposal.lender);
            if (interaction.user.id !== lender.pid) {
                return interaction.reply({ content: "You are not the lender.", ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`loan-submitcustom-${proposalId}`)
                .setTitle('Propose Custom Loan Terms');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('interestRate')
                        .setLabel("Interest Rate per Cycle (%)")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('e.g., 5 for 5%')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('paymentRate')
                        .setLabel("Mandatory Payment Rate per Cycle (%)")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('e.g., 10 for 10%')
                        .setRequired(true)
                )
            );
            
            await interaction.showModal(modal);
            break;
        }

        default:
            return interaction.reply({ content: 'Unknown loan action.', ephemeral: true });
    }
};

// ==================================================================================
//                            MODAL HANDLER
// ==================================================================================
module.exports.modal = async (interaction, game, client) => {
    const [modalName, action, proposalId] = interaction.customId.split('-');

    if (action === 'submitcustom') {
        const proposal = game.loanProposals.find(p => p.id === proposalId);
        if (!proposal) return interaction.reply({ content: 'This loan request has expired.', ephemeral: true });

        const customInterestRate = parseFloat(interaction.fields.getTextInputValue('interestRate'));
        const customPaymentRate = parseFloat(interaction.fields.getTextInputValue('paymentRate'));

        if (isNaN(customInterestRate) || isNaN(customPaymentRate)) {
            return interaction.reply({ content: 'Invalid input. Please provide numbers only.', ephemeral: true });
        }

        proposal.interestRate = customInterestRate / 100;
        proposal.paymentRate = customPaymentRate / 100;
        proposal.type = 'offer';

        const borrower = game.getCountry(proposal.borrower);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`loan-accept-${proposal.id}`).setLabel('Accept Counter-Offer').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`loan-decline-${proposal.id}`).setLabel('Decline Counter-Offer').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: 'Your counter-offer has been sent to the borrower.', ephemeral: true });

        try {
            const borrowerUser = await interaction.client.users.fetch(borrower.pid);
            borrowerUser.send({
                content: `**Counter-Offer Received from ${proposal.lender}**!\nThey have responded to your loan request with custom terms. Do you accept?`,
                components: [row]
            });
        } catch {}
    }
};