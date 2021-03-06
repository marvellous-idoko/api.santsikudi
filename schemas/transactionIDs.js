const mongoose = require('mongoose');

const transID = mongoose.Schema({
    transType: {
        type: String,
        required: true
    },
    transDtInit: {
        type: Date,
        required: true
    },
    transAcctInit: {
        type: String,
        required: true
    },
    amt:{
        type: String,
        required: true
    },
    transID:{
        type: String,
        required: true
    },
    tranExed: {
        type: Boolean,
        required: true
    },
    tranDtExe: {
        type: Date,
    }
});
const transID = module.exports = mongoose.model('transID', transID);
