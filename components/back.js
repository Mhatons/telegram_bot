module.exports = function goBack() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Go back', callback_data: 'goback' }],
            ]
        }
    };
}