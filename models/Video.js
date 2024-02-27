const mongoose = require('mongoose');

const videoSchema = mongoose.Schema({
    src: String,
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'players' }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tags' }],
    date: Date,
    title: String,
    author: { type: String, default: "" }
});

const Video = mongoose.model('videos', videoSchema);

module.exports = Video;