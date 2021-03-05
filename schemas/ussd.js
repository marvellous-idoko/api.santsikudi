const mongoose = require('mongoose');

const ussd = mongoose.Schema({
  contact:{
      type: String,
  },
  pin:{
      type: String
  }
    
})

const ussdd = module.exports = mongoose.model('ussd', ussd);
