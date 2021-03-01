const { request } = require('express');
const mongoose = require('mongoose');

const loan = mongoose.Schema({
    reason: {
        type: String,
        required: true
    },
    aboutBusiness:{
        type: String,
        required: true
    }, 
    summary:{
        type: String,
        required: true
    },
    intRate: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },
    VCOffer: {

        intRate: {
            type: String
        },
        amount: {
            type: Number
        },
        duration: {
            type: String
        },
        acctId:{
            type: String

        }


    },
    dateOfRequest: {
        type: Date,
        required:true
    },
    paid: {
        type: Boolean
    },
    repaid: {
        type: Boolean

    },
    accepted: {
        type: Boolean

    },
    loanId: {
        type: String,
        required:true
    },
    acctId: {
        type: String,
        required:true
    }
});
const loanr = module.exports = mongoose.model('loan', loan);
