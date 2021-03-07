const mongoose = require('mongoose');

const transID = mongoose.Schema({
    AgentID:{
        type: String,
        required: true
    },
    dateOfReg: {
        type: Date,
        required: true
    },
    pin: {
        type: String,
        required: true
    }
});
const transacID = module.exports = mongoose.model('transID', transID);
