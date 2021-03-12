const mongoose = require('mongoose');

const debit = mongoose.Schema({
    dateOfTransaction: {
        type: Date,
        required: true
    },
    amtWitdrawn:{
        type:String,
        required: true
    },
    refNo:{
        type: String,
        required:true
    },
    account_no:{
        type: String,
        required: true
    }
    
})

const dbtHis = module.exports = mongoose.model('debHis', debit);
