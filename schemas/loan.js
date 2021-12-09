const mongoose = require('mongoose');

const loan = mongoose.Schema({
    reason: {
        type: String,
        required: true
    },
    nameOfOrg: {
        type: String,
    },
    size: {
        type: String,
    }, 
    gender: {
        type: String,
    },
    ind: {
        type: String,
    },
    aboutBusiness: {
        type: String,
        required: true
    },
    summary: {
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
        msg: {
            type: String
        },
        amount: {
            type: Number
        },
        duration: {
            type: String
        },
        acctIdOfFinancier: {
            type: String
        }
    },
    dateOfRequest: {
        type: Date,
        required: true
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
    offered: {
        type: Boolean
    },
    loanId: {
        type: String,
        required: true
    },
    acctId: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        required: true
    }
});
const loanr = module.exports = mongoose.model('loan', loan);
