"use strict";

const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const cors = require("cors");
const dns = require('dns');
const url = require('url');
const path = require('path');
const shortid = require('shortid');
const app = express();


let schema = mongoose.Schema; 
let URLSchema = new schema({
  longURL: {type: String, required: true},
  shortURL: {type: String, required: true}
});

const webURL = mongoose.model('webURL', URLSchema);

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true})
console.log('readyState' + mongoose.connection.readyState)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
// app.use()
app.use( bodyParser.urlencoded({extended: false}) )

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.post('/api/shorturl/new/', (req, res, next) => {
  const q = url.parse(req.body.url, true)
  const lookupURL = `${q.host}`
  
  dns.lookup(lookupURL, (err, address, next) => {
    if (err) res.json({"error":"invalid URL"});
    const newURL = new webURL({
      longURL: req.body.url,
      shortURL: shortid.generate()
    });
    
    webURL.find({longURL: String(req.body.url)}, (err, url) => {
      if (err) console.log(err);
      
      if (!url[0]) {
        newURL.save( (err, data) => {
          if (err) console.log(err); 
        });
        res.json({
          'original-url': newURL.longURL,
          'short-url': newURL.shortURL
        });
        return
      }
      
      res.json({
        'original-url': url[0].longURL,
        'short-url': url[0].shortURL
      });
    });
  });
});

app.get('/api/shorturl/:shortURL', (req, res) => {
  webURL.find({shortURL: req.params.shortURL}, (err, url) => {
    if (err || (!url) ) res.json({"error":"invalid URL"});
    res.redirect(url[0].longURL);
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});