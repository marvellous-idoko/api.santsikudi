const mongoose = require('mongoose');
const crypto = require("crypto");

const user = mongoose.Schema({
    account_no:{
        type: Number,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },

    acctBal: {
        type: Number,
        required: true
    },
    bvn:{
        type: Number
        },
    contact:{
        type:String,
        required:true
    },
    ipAddress:{
        type:String,
        required:true
    },
    location:{
        longitude:{type:String,
            required:true
        },
        latitude:{type:String,
            required:true
        }
    },
    address:{
        type:String,
        required:true
    },
    abtBiz:{
        
        type:String,
        required:true},
   
     acctType:{
        type:String,
        required:true 
    },
    photo:{
        
        type:String,
        required:true
    },
    nameOfBiz:{
    
        type:String,
        required:true
    },
    cacId:{
        type:String,
        required:true
    },
    DOI:{
        type: Date,
        required:true
    },
    industry:{
        type:String,
        required:true
    },
    bizContact:{
        type:String,
        required:true
    },
    bizAddress:{        
        type:String,
        required:true
    },
    bizEmail:{
        type:String,
        required:true
    },
    sizeOfBiz:{
        type:Number,
        required:true
    },
    verified:{
        type: Boolean,
        required:true
    },
    
    hash : String, 
    salt : String 
    
});


user.methods.setPassword = function(password) { 
     
    // Creating a unique salt for a particular user 
       this.salt = crypto.randomBytes(16).toString('hex'); 
     
       // Hashing user's salt and password with 1000 iterations, 
        
       this.hash = crypto.pbkdf2Sync(password, this.salt,  
       1000, 64, `sha512`).toString(`hex`); 
   }; 
     
   // Method to check the entered password is correct or not 
   user.methods.validPassword = function(password) { 
       var hash = crypto.pbkdf2Sync(password,  
       this.salt, 1000, 64, `sha512`).toString(`hex`); 
       return this.hash === hash; 
   }; 
const userr = module.exports = mongoose.model('user', user);
