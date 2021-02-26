const mongoose = require('mongoose');

const user = mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    acctType: {
        type: String,
        required: true
    },
    dateOfRegistration: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    account_no: {
        type: String,   
        required: true
    },
    verified:{
        type: Boolean
    },
    bvn:{
        type: Number,
    },
    acctBalance:{
        type: Number,
        required:true
    }
});
const userr = module.exports = mongoose.model('user', user);
