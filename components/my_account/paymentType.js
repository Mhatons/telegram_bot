module.exports = function getPaymentTypes() {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'FIAT - Card Payment', callback_data: 'card_payment' },
                    { text: 'USDT Crypto', callback_data: 'crypto_payment' }
                ],
            ]
        }
    };
}
