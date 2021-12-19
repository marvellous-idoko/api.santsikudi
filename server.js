var express = require("express");
var cors = require("cors");
var mongoose = require("mongoose");

var app = express();
var route = require('./router')

const url = "mongodb+srv://Sparrow:polio2929@insurebeta.1vplu.mongodb.net/Sparrow?retryWrites=true&w=majority";
// mongoose.connect('mongodb://localhost:27017/',{useNewUrlParser: true, useUnifiedTopology: true })


mongoose.connect(url , {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
mongoose.connection.on('connected', ()=>{
    
    console.log("connected to DB");
});
mongoose.connection.on('error',(err)=>{
    if(err)console.log("error in DB connection"+err);
    console.log("connected")
})

app.use(cors());
app.options('*', cors())

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', route);

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
console.log("starting... server at "+port);
});
