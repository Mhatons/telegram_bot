// Trading info component
module.exports = function accountMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💵 Top up your balance 💵', callback_data: 'top_up_balance' }],
                [{ text: '💸 Withdrawal of funds 💸', callback_data: 'funds_withdrawal' }],
                [{ text: '🔍 Balance history 🔍', callback_data: 'balance_history' }],
                [{ text: '👥 Referral system 👥', callback_data: 'referral_system' }],
                [{ text: ' Activate Web Login ', callback_data: 'activate_web_login' }],
            ]
        }
    };
};
