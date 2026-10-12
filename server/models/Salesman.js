const mongoose = require('mongoose');

const salesmanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    code: {
        type: Number
    },
    app_code: {
        type: Number
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Salesman || mongoose.model('Salesman', salesmanSchema);