// FAQ component
module.exports = function getFAQ() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '1. How does the BOT work?', callback_data: 'work' }],
                [{ text: '2. Expected earnings', callback_data: 'earnings' }],
                [{ text: '3. How to make an investment?', callback_data: 'investments' }],
                [{ text: '4. How to withdraw profits?', callback_data: 'profits' }],
                [{ text: '5. What is the fee, or commission?', callback_data: 'commission' }],
                [{ text: '6. Exchange/Broker', callback_data: 'exchange_broker' }],
                [{ text: '7. How are losses managed', callback_data: 'losses' }],
                [{ text: '8. Tenure of our BOT', callback_data: 'tenure' }],
                [{ text: '9. Referral earnings', callback_data: 'referral_earnings' }],
                [{ text: '10. Regional restrictions', callback_data: 'regional_restrictions' }],
                [{ text: '11. How can I check of my capital is invested?', callback_data: 'invested_capital' }],
                [{ text: '12. Transparency', callback_data: 'transparency' }],
            ]
        }
    };
}
