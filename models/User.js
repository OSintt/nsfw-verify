const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    discriminator: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        unique: true,
        required: true
    },
    accessToken: {
        type: String,
        unique: true
    }
});

module.exports = mongoose.model('User', UserSchema);