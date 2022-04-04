// IMPORT LIBRARIES
const express = require('express');
const path = require("path");
const mysql = require('mysql');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const fileupload = require("express-fileupload");
require('dotenv').config();

// CONFIG EXPRESS
const {ROUTE_HOME, ROUTE_TEST_LOGIN, ROUTE_LOGIN, ROUTE_REGISTER, ROUTE_SEARCH, ROUTE_ADD_PRODUCT} = require("./routes");

const app = express();
app.use(fileupload());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// ROUTAGE EXPRESS
app.use(ROUTE_LOGIN, login)
app.use(ROUTE_REGISTER, register)
app.get(ROUTE_TEST_LOGIN, authenticateToken, testLogin)
app.get(ROUTE_SEARCH, search)
app.use(ROUTE_ADD_PRODUCT,  addProduct)

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

function login(request, response) {

  let email = request.query.email;
	let password = request.query.password;

	// Ensure the input fields exists and are not empty
	if (email && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT username,email,birth,town,zipcode,profile_pic,sexe, name, surname FROM accounts JOIN passwords p ON accounts.user_id=p.owner WHERE email= ?  AND p.password= ?', [email, password], function(error, results, fields) {
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

function register(request, response) {

  const user = request.body.data;
  const userValues = [
    user.name,
    user.surname,
    user.username,
    user.email,
    user.birth,
    user.zipcode,
    user.town,
    user.sexe,
    '',
  ]
  let resultAdd;
  connection.query("INSERT INTO `things`.`accounts` ( `name`,`surname`,`username`, `email`, `birth`, `zipcode`, `town`, `sexe`, `profile_pic`) VALUES (? , ? , ? , ? , ? , ? , ? , ? , ? );", userValues,  function(error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    connection.query("INSERT INTO `things`.`passwords` ( `owner`, `password`) VALUES ( ? , ? );", [results.insertId, user.password],  function(error, passwordResults, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;
      // If the account exists
      const token = generateAccessToken({ email: request.query.email });
      response.json({id_token : token, user: null, message: "User connected"});
      response.end();
    });
  })

}

function testLogin(req, res, next) {
    res.json({result : true})
}

function search(req, res, next) {
  //SELECT*FROM products JOIN accounts a ON products.`owner`=a.user_id WHERE title LIKE'%%' AND a.town LIKE'%Be%' AND price BETWEEN 0 AND 800 AND categories LIKE'%Multimedia%'

  const filters = req.headers;
  console.log(filters)
  const userFilters = [
      '%' + filters.title + '%',
      '%' + filters.place + '%',
      filters.pricemin ? parseInt(filters.pricemin) : 0,
      filters.pricemax ? parseInt(filters.pricemax) : 10000,
      '%' + filters.categorie + '%',
  ]
  let resultAdd;
  connection.query("SELECT*FROM products JOIN accounts a ON products.`owner`=a.user_id WHERE title LIKE ? AND a.town LIKE ? AND price BETWEEN ? AND ? AND categories LIKE ?", userFilters,  function(error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    console.log(results)
    res.json(results)
  })

}

function addProduct(req, res, next) {
  console.log(req.files)
  res.json({result : true})
}


app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})

