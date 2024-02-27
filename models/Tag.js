const mongoose = require('mongoose');

const tagSchema = mongoose.Schema({
    name: String,
    color: String,
});

const Tag = mongoose.model('tags', tagSchema);

module.exports = Tag;