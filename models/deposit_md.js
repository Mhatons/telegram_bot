const mongoose = require('mongoose');
const schema = mongoose.Schema;

const depositSchema = new schema({
    userId: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    coin: {
        type: String, required: false
    },
    publicKey: {
        type: String, required: false
    },
    privateKey: {
        type: String,
        required: false
    },
    depositedAt: {
        type: Date,
        default: Date.now
    },
})

const depositModel = mongoose.model("deposits", depositSchema)
module.exports = depositModel