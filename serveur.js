// IMPORT LIBRARIES
const express = require('express');
const path = require("path");
const mysql = require('mysql');
const cors = require('cors')
require('dotenv').config();


// CONFIG EXPRESS
const {ROUTE_HOME, ROUTE_CONTACT} = require("./routes");

const app = express();
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())

// ROUTAGE EXPRESS
app.get(ROUTE_HOME, home)


// FUNCTION EXPRESS
function home(req, res) {
    res.json({result : "home"})
}

app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})

