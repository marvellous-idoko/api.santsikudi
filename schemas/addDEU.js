const mongoose = require('mongoose');

const usr = mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    
});
const usrr = module.exports = mongoose.model('usr', usr);
