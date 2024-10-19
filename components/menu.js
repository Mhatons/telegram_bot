// Menu component
module.exports = function getMenu() {
    return {
        reply_markup: {
            // inline_keyboard: [
            //     [
            //         { text: '📊 Trading', callback_data: 'trading' },
            //         { text: '⏸️ Stop/Start Trading', callback_data: 'toggle_trading' },
            //         { text: '📈 Bot Stats', callback_data: 'trading_stats' }
            //     ],
            //     [
            //         { text: '📢 Bot Channel', callback_data: 'trading_channel' },
            //         { text: '👤 My Account', callback_data: 'my_account' },
            //         { text: '💵 Top up', callback_data: 'top_up_balance' }
            //     ],
            //     [
            //         { text: '💸 Withdraw', callback_data: 'withdraw_funds' },
            //         { text: '📜 Balance History', callback_data: 'balance_history' },
            //         { text: '🎁 Referral System', callback_data: 'referral_system' }
            //     ],
            //     [
            //         { text: '❓ FAQ', callback_data: 'faq' },
            //         { text: '📢 Channel', callback_data: 'channel' },
            //         { text: '💬 Chat', callback_data: 'chat' }
            //     ],
            //     [
            //         { text: '🆘 Support', callback_data: 'support' }
            //     ]
            // ]

            inline_keyboard: [
                [
                    { text: '📈 Trading', callback_data: 'trading' },
                    { text: '👤 My Account', callback_data: 'my_account' },
                    { text: '❓ FAQ', callback_data: 'faq' },
                ],
                [
                    { text: '📢 Channel', callback_data: 'channel' },
                    { text: '💬 Chat', callback_data: 'chat' },
                    { text: '🆘 Support', callback_data: 'support' }
                ],
            ]
        }
    };
};
