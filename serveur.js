// IMPORT LIBRARIES
const express = require('express');
const path = require("path");
const mysql = require('mysql');
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config();

// CONFIG EXPRESS
const {ROUTE_HOME, ROUTE_CONTACT, ROUTE_LOGIN} = require("./routes");

const app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// ROUTAGE EXPRESS
app.get(ROUTE_HOME, home)
app.use(ROUTE_LOGIN, login)
app.get(ROUTE_CONTACT, authenticateToken, contact)

// JWT TOKEN 

function generateAccessToken(username) {
    return jwt.sign(username, process.env.JWT_SECRET_TOKEN, { expiresIn: '1800s' });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader;
  
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.JWT_SECRET_TOKEN, (err, user) => {
      console.log(err)
  
      if (err) return res.sendStatus(403)
  
      req.user = user
  
      next()
    })
  }

// FUNCTION EXPRESS
function home(req, res) {
    res.json({result : "home"})
}

function login(req, res) {
    const token = generateAccessToken({ username: req.query.username });
    res.json(token);
}

function contact(req, res, next) {
    res.json({result : true})
}


app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})

