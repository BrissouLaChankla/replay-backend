const mongoose = require('mongoose');

const playerSchema = mongoose.Schema({
    name: String,
});

const Player = mongoose.model('players', playerSchema);

module.exports = Player;