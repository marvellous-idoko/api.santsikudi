const mongoose = require('mongoose');

const offer = mongoose.Schema({
    dateOfoffer: {
        type: Date,
        required: true
    },
    loanId:{
        type:String,
        required: true
    },
    amt:{
        type:Number,
        required: true
    },
    intRate:{
        type:String,
        required: true
    },
    years:{
        type:String,
        required: true
    },
    idofrecepient:{
        type: String,
        required: true
    },
    id:{
        type: String,
        required: true
    },
    accepted:{
        type:Boolean
    }
    
})

const offerr = module.exports = mongoose.model('offer', offer);
