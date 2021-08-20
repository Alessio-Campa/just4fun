import {User} from "../models/User";
import * as user from '../models/User'

import jwt = require('express-jwt')
import passport = require("passport");
import passportHTTP = require('passport-http')

import jsonWebToken = require('jsonwebtoken')

let JwtStrategy = require('passport-jwt').Strategy;
let AnonymousStrategy = require('passport-anonymous').Strategy;
let ExtractJwt = require('passport-jwt').ExtractJwt;

const JWT_EXPIRATION = '1d';

export function initializeAuthentication() {
    if (!process.env.JWT_SECRET){
        console.log('".env" file loaded but JWT_SECRET=<secret> key-value pair not found'.red);
        process.exit(-1);
    }

    let opts = {
        'jwtFromRequest': ExtractJwt.fromAuthHeaderAsBearerToken(),
        'secretOrKey': process.env.JWT_SECRET
    };
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        user.getModel().findOne({email: jwt_payload.email}, (err, user) => {
            if (err)
                return done({statusCode:500, error:true, errormessage:err});

            return done(null, user);
        });
    }));
    passport.use(new passportHTTP.BasicStrategy(
        function (email, password, done){
            console.log("New login attempt from ".yellow + email);
            user.getModel().findOne( {email:email}, (err, user: User) => {
                if (err)
                    return done({statusCode:500, error:true, errormessage:err});

                if (!user)
                    return done({statusCode:401, error:true, errormessage:"Invalid user"});

                if (user.validatePassword(password))
                    return done(null, user);
                else
                    return done({statusCode: 401, error: true, errormessage: "Invalid password"});
            })
        }
    ));
    passport.use(new AnonymousStrategy());
}

export function signToken(tokenData: object)
{
    return jsonWebToken.sign(tokenData, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION } );
}

export let express_jwt_auth = jwt({secret: process.env.JWT_SECRET, algorithms: ["HS256"]});
