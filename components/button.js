module.exports = function button(text, callbackID) {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: text, callback_data: callbackID }
                ],
            ]
        }
    };
}
