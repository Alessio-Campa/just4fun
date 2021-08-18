import colors = require('colors')
colors.enabled = true;
import express = require('express')
import passport = require('passport')
import passportHTTP = require('passport-http')
import jsonWebToken = require('jsonwebtoken')
import * as user from '../models/User'
import {User} from "../models/User";

const JWT_EXPIRATION = '1d';

declare global{
    namespace Express{
        interface User {
            email: string,
            username: string,
            roles: string[],
            id: string,
        }
    }
}

let router = express.Router();

router.get("/", (req, res, next)=>{
    next({statusCode: 200, api_version:"1.0", endpoints:["/chat", "/match", "/user"]})
})

passport.use( new passportHTTP.BasicStrategy(
    function (username, password, done){
        console.log("New login attempt from ".yellow + username);
        user.getModel().findOne( {email:username}, (err, user: User)=>{
            if (err) {
                return done( {statusCode:401, error:true, errormessage:err} );
            }
            if (!user) {
                return done(null, false,{statusCode:401, error:true, errormessage:"Invalid user"});
            }
            if (user.validatePassword(password)) {
                if(!user.isPasswordTemporary)
                {
                    return done(null, user);
                }
                else
                {
                    return done(null, false, {statusCode: 422, error: true, errormessage: "Please change your temporary password"})
                }
            }
            else {
                return done(null, false, {statusCode: 401, error: true, errormessage: "Invalid password"})
            }
        })
    }
));

router.get('/login', passport.authenticate('basic', {session: false}), (req, res, next)=>{
    let tokenData = {
        username: req.user.username,
        roles: req.user.roles,
        email: req.user.email,
        id: req.user.id
    };

    console.log("Login granted. Generating token" );
    let token_signed = jsonWebToken.sign(tokenData, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION } );

    return next({statusCode: 200, error: false, errormessage: "", token: token_signed });

});

export = router;


