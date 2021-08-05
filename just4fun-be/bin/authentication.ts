import jwt = require('express-jwt')

if (!process.env.JWT_SECRET){
    console.log('".env" file loaded but JWT_SECRET=<secret> key-value pair not found'.red);
    process.exit(-1);
}

export = jwt( {secret: process.env.JWT_SECRET, algorithms: ["HS256"]} );
