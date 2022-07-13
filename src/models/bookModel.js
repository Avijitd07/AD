const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true
    },
    excerpt: {
        type: String,
        required: [true, 'Excerpts is required']
    },
    userId: {
        type: ObjectId,
        required: [true, 'UserId is required'],
        ref: 'User'
    },
    ISBN: {
        type: String,
        required: [true, 'ISBN is required'],
        unique: true
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    subcategory: [{
        type: String,
        required: [true, 'Subcategory is required'],
        trim: true
    }],
    reviews: {
        type: Number,
        default: 0,
        trim: true
    },
    deletedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    releasedAt: {
        type: Date,
        required: [true, 'Category is required']
    }
}, { timestamps: true });


module.exports = mongoose.model("Book", bookSchema);