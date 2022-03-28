// IMPORT LIBRARIES
const express = require('express');
const path = require("path");
const mysql = require('mysql');
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config();

// CONFIG EXPRESS
const {ROUTE_HOME, ROUTE_TEST_LOGIN, ROUTE_LOGIN} = require("./routes");

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
app.get(ROUTE_TEST_LOGIN, authenticateToken, testLogin)

// MYSQL 

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'things',
  password: 'arthurlachienne',
  database: 'things'
});
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
});

// JWT TOKEN 
function generateAccessToken(email) {
    return jwt.sign(email, process.env.JWT_SECRET_TOKEN, { expiresIn: '1800s' });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader;
  
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.JWT_SECRET_TOKEN, (err, user) => {  
      if (err) return res.sendStatus(403)

      req.user = user
  
      next()
    })
  }

// FUNCTION EXPRESS
function home(req, res) {
    res.json({result : "home"})
}

function login(request, response) {

  let email = request.query.email;
	let password = request.query.password;

	// Ensure the input fields exists and are not empty
	if (email && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT username,email,birth,town,zipcode,profile_pic,sexe FROM accounts JOIN passwords p ON accounts.user_id=p.password_id WHERE email= ?  AND p.password= ?', [email, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Redirect to home page
				const token = generateAccessToken({ email: request.query.email });
        response.json({id_token : token, user: results[0], message: "User connected"});
			} else {
				response.json({id_token : null, user: null, message: 'Incorrect Username and/or Password!'});
			}			
			response.end();
		});
	} else {
		response.json({id_token : null, user: null, message: 'Please enter Username and Password!'});
		response.end();
	}
}

function testLogin(req, res, next) {
    res.json({result : true})
}


app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})

