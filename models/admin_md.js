const mongoose = require('mongoose');
const schema = mongoose.Schema;

const adminSchema = new schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

const adminModel = mongoose.model("admin", adminSchema)
module.exports = adminModel