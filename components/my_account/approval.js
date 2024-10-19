module.exports = function getApproval() {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Agree', callback_data: 'agree' },
                    { text: 'Go back', callback_data: 'rejected' }
                ],
            ]
        }
    };
}
