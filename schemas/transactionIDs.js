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
    aod: {
        type: String,
    },
    nod: {
        type: String,
    },
    nor: {
        type: String,
    },
    aor: {
        type: String,
    },
    amt:{
        type: String,
        required: true
    },
    transcID:{
        type: String,
        required: true
    },
    tranExed: {
        type: Boolean,
        required: true
    },
    tranDtExe: {
        type: Date,
    },
    witAcct:{
        type: String
    },
    witName:{
        type:String
    }
});
const transacID = module.exports = mongoose.model('transID', transID);
