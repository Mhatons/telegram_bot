module.exports = function getTradingStatistics() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '24 hours', callback_data: '24hours' }],
                [{ text: '3 days', callback_data: '3days' }],
                [{ text: '7 days', callback_data: '7days' }],
                [{ text: '1 month', callback_data: '1month' }],
                [{ text: '3 months', callback_data: '3months' }],
                [{ text: 'Go back', callback_data: 'back_menu' }],
            ]
        }
    };
}