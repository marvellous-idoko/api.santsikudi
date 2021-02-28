const mongoose = require('mongoose');

const trancsaction = mongoose.Schema({
    dateOfTransaction: {
        type: Date,
        required: true
    },
    nameOfDepostor:{
        type:String,
        required: true
    },
    account_noOfDepositor:{
        type:String,
        required: true
    },
    amountDeposited:{
        type:String,
        required: true
    },
    account_noOfReceipient:{
        type:String,
        required: true
    },
    nameOfReceipient:{
        type: String,
        required:true 
    },
    refNo:{
        type: String,
        required:true
    }
    
})

const transaction = module.exports = mongoose.model('trancsaction', trancsaction);
