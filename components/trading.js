// Trading info component
module.exports = function getTradingInfo(isTradingActive) {
    const toggleButtonText = isTradingActive ? "Stop trading" : "Start trading"
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: toggleButtonText, callback_data: 'toggle_trading' }],
                [{ text: 'Switch trading mode', callback_data: 'switch_trading_mode' }],
                [{ text: '📉 Trading bot statistics 📉', callback_data: 'trading_bot_statistics' }],
                // [{ text: '📰 Trading bot channel 📰', callback_data: 'trading_bot_channel' }],
                [
                    {
                        text: '📰 Trading bot channel 📰',
                        url: 'https://t.me/portalearn_trades' // Direct link button
                    }
                ]
            ]
        }
    };
};
