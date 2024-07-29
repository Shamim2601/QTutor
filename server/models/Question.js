const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    questionText: {
        type: String,
        required: true,
    },
    knowCount: {
        type: Number,
        default: 0,
    },
    dontKnowCount: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
    }
});

module.exports = mongoose.model('Question', QuestionSchema);