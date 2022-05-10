// IMPORT LIBRARIES
const express = require('express');
const path = require("path");
const mysql = require('mysql');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const fileupload = require("express-fileupload");
const fs = require('fs')
require('dotenv').config();

// CONFIG EXPRESS
const { ROUTE_HOME, ROUTE_TEST_LOGIN, ROUTE_LOGIN,ROUTE_DELETE_PRODUCT, ROUTE_REGISTER, ROUTE_SEARCH, ROUTE_PRODUCT_BY_ID, ROUTE_ADD_PRODUCT, ROUTE_PHOTOS, ROUTE_ADD_LIKE,ROUTE_UN_LIKE, ROUTE_CHECK_LIKE, ROUTE_HAVE_LIKED_PRODUCTS, ROUTE_PRODUCTS_BY_SELLER } = require("./routes");
const { read } = require('fs');

const app = express();
app.use(fileupload());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// ROUTAGE EXPRESS
app.use(ROUTE_LOGIN, login)
app.use(ROUTE_REGISTER, register)
app.get(ROUTE_TEST_LOGIN, authenticateToken, testLogin)
app.get(ROUTE_SEARCH, search)
app.use(ROUTE_HAVE_LIKED_PRODUCTS, likedProducts)
app.use(ROUTE_ADD_PRODUCT, addProduct)
app.use(ROUTE_ADD_LIKE, addLike)
app.use(ROUTE_UN_LIKE, unLike)
app.use(ROUTE_CHECK_LIKE, checkLike)
app.get(ROUTE_PHOTOS, photos)
app.get(ROUTE_PRODUCT_BY_ID, product_by_id)
app.use(ROUTE_PRODUCTS_BY_SELLER, products_by_seller)
app.use(ROUTE_DELETE_PRODUCT, delete_product)

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
    connection.query('SELECT user_id,username,email,birth,town,zipcode,profile_pic,sexe, name, surname FROM accounts JOIN passwords p ON accounts.user_id=p.owner WHERE email= ?  AND p.password= ?', [email, password], function (error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;
      // If the account exists
      if (results.length > 0) {
        // Redirect to home page
        const token = generateAccessToken({ email: request.query.email });
        response.json({ id_token: token, user: results[0], message: "User connected" });
      } else {
        response.json({ id_token: null, user: null, message: 'Incorrect Username and/or Password!' });
      }
      response.end();
    });
  } else {
    response.json({ id_token: null, user: null, message: 'Please enter Username and Password!' });
    response.end();
  }
}

function register(request, response) {

  console.log(request.body.data)
  response.end();
  /*
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
  connection.query("INSERT INTO `things`.`accounts` ( `name`,`surname`,`username`, `email`, `birth`, `zipcode`, `town`, `sexe`, `profile_pic`) VALUES (? , ? , ? , ? , ? , ? , ? , ? , ? );", userValues, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    connection.query("INSERT INTO `things`.`passwords` ( `owner`, `password`) VALUES ( ? , ? );", [results.insertId, user.password], function (error, passwordResults, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;
      // If the account exists
      const token = generateAccessToken({ email: request.query.email });
      response.json({ id_token: token, user: null, message: "User connected" });
      response.end();
    });
    
  })
  */
}

function testLogin(req, res, next) {
  res.json({ result: true })
}

function search(req, res, next) {
  //SELECT*FROM products JOIN accounts a ON products.`owner`=a.user_id WHERE title LIKE'%%' AND a.town LIKE'%Be%' AND price BETWEEN 0 AND 800 AND categories LIKE'%Multimedia%'

  const filters = req.headers;
  //console.log(filters)
  const userFilters = [
    '%' + filters.title + '%',
    '%' + filters.place + '%',
    filters.pricemin ? parseInt(filters.pricemin) : 0,
    filters.pricemax ? parseInt(filters.pricemax) : 10000,
    '%' + filters.categorie + '%',
  ]
  let resultAdd;
  connection.query("SELECT*FROM products JOIN accounts a ON products.`owner`=a.user_id WHERE title LIKE ? AND a.town LIKE ? AND price BETWEEN ? AND ? AND categories LIKE ?", userFilters, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    //console.log(results)
    res.json(results)
  })

}

function likedProducts(req,res,next){
  console.log(req.body.data)
  connection.query("SELECT * FROM likes JOIN products p ON likes.product = p.product_id JOIN accounts a ON p.`owner`=a.user_id WHERE likes.`owner` LIKE ?", [req.body.data.owner_id], function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    //console.log(results)
    res.json(results)
    res.end();
  })
}

function addProduct(req, res, next) {
  console.dir(req.files.photos.length)
  console.log(req.body)

  try {
    if (!req.files.photos) {
      res.send({
        status: false,
        message: 'No file uploaded'
      });
    } else {
      let url_pics = [];

      //loop all files
      if (req.files.photos.length){
        for (let i = 0; i < req.files.photos.length; i++) {
          let photo = req.files.photos[i];
  
          //move photo to uploads directory
          fs.mkdirSync(`./uploads/${req.body.owner}`, { recursive: true })
          photo.mv(`./uploads/${req.body.owner}/` + photo.name);
  
          //push file details
          url_pics.push(`https://api.things.victorbillaud.fr/photos?id=${req.body.owner}&name=${photo.name}`);
        }
      }else{
        let photo = req.files.photos;
  
        //move photo to uploads directory
        fs.mkdirSync(`./uploads/${req.body.owner}`, { recursive: true })
        photo.mv(`./uploads/${req.body.owner}/` + photo.name);

        //push file details
        url_pics.push(`https://api.things.victorbillaud.fr/photos?id=${req.body.owner}&name=${photo.name}`);
      }
      


      const userValues = [
        req.body.title,
        req.body.description,
        new Date(),
        url_pics[0],
        url_pics[1] == null ? '' : url_pics[1],
        url_pics[2] == null ? '' : url_pics[2],
        req.body.owner,
        parseInt(req.body.price),
        req.body.categorie,
      ]

      // query insert into

      connection.query("INSERT INTO `things`.`products` ( `title`,`description`,`date`, `product_pic_1`, `product_pic_2`, `product_pic_3`, `owner` , `price`, `categories`) VALUES (? , ? , ? , ? , ? , ? , ? , ? , ? );", userValues, function (error, results, fields) {
        // If there is an issue with the query, output the error
        if (error) throw error;
        // If the account existsus
        res.json({ message: 'Product has been uploaded' });
        res.end();
      })

    }
  } catch (err) {
    console.error(err)
    res.status(500).send(err);
  }

}

function addLike(req, res, next){
  console.log(req.body.data);

  connection.query("INSERT IGNORE INTO `things`.`likes` ( `owner`,`product` ) VALUES (? , ?);", [req.body.data.owner_id , req.body.data.product_id], function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    res.send(true);
    res.end();
  })

}

function unLike(req, res, next){
  console.log(req.body.data);

  connection.query("DELETE FROM `things`.`likes`  WHERE `owner` LIKE ? AND `product` LIKE ? ;", [req.body.data.owner_id , req.body.data.product_id], function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    res.send(true);
    res.end();
  })
}

function checkLike(req, res, next){

  connection.query("SELECT * FROM likes WHERE `owner` LIKE  ?  AND `product` LIKE ?", [req.body.data.owner_id , req.body.data.product_id ], function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    console.log("check like" , results)
    results[0] ? res.send(true) : res.send(false);
    res.end();
  })

}

function photos(req, res, next) {
  res.sendFile(__dirname + `/uploads/${req.query.id}/${req.query.name}`)
}

function product_by_id(req, res, next) {
  const userFilters = [
    req.query.id
  ]

  connection.query("SELECT * FROM products JOIN accounts a ON products.`owner`=a.user_id WHERE product_id = ? ", userFilters, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    console.log(results)
    res.json(results[0])
  })
}

function products_by_seller(req, res, next) {
  connection.query("SELECT * FROM products WHERE owner = ? ", req.body.data.owner_id, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    res.json(results)
  })
}

function delete_product(req, res, next) {
  console.log(req.body.data.id)
  connection.query("DELETE FROM products WHERE product_id = ? ;", req.body.data.id, function (error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the account existsus
    res.json(results)
  })
}



app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})

