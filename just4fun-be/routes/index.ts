import colors = require('colors')
colors.enabled = true;
import express = require('express')
import passport = require('passport')
import passportHTTP = require('passport-http')
import jsonWebToken = require('jsonwebtoken')
import * as user from '../models/User'


const JWT_EXPIRATION = '1d';

declare global{
    namespace Express{
        interface User{
            mail: string,
            username: string,
            roles: string[],
            id: string,
        }
    }
}

let router = express.Router();

router.get("/", (req, res)=>{
    res.status(200).json({api_version:"1.0", endpoints:["/chat", "/match", "/user"]})
})

passport.use( new passportHTTP.BasicStrategy(
    function (username, password, done){
        console.log("New login attempt from ".yellow + username);
        user.getModel().findOne( {mail:username}, (err, user)=>{
            if (err){
                return done( {statusCode:401, error:true, errormessage:err} );
            }
            if (!user){
                return done(null, false,{statusCode:500, error:true, errormessage:"Invalid user"});
            }
            if (user.validatePassword(password)){
                return done(null, user);
            }

            return done(null, false, {statusCode:500, error:true, errormessage:"Invalid password"})
        })
    }
));

router.get('/login', passport.authenticate('basic', {session: false}), (req, res, next)=>{
    let tokenData = {
        username: req.user.username,
        roles: req.user.roles,
        mail: req.user.mail,
        id: req.user.id
    };

    console.log("Login granted. Generating token" );
    let token_signed = jsonWebToken.sign(tokenData, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION } );

    return res.status(200).json({ error: false, errormessage: "", token: token_signed });

});

export = router;


