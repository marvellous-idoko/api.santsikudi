var express = require("express");
var cors = require("cors");
var mongoose = require("mongoose");

var app = express();
var route = require('./router')

app.use(cors());
app.options('*', cors())

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', route);

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
console.log("starting... server at "+port);
});
