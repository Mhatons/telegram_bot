module.exports = function getPaymentTypes() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '+10 transactions', callback_data: 'show_10' }],
                [{ text: 'show all transactions', callback_data: 'show_all' }],
            ]
        }
    };
}