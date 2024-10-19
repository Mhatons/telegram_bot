// Trading info component
module.exports = function getTradingMode() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Conservative', callback_data: 'conservative' }],
                [{ text: 'Aggressive', callback_data: 'aggressive' }],
            ]
        }
    };
};
