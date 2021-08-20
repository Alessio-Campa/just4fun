import colors = require('colors')
colors.enabled = true;
import express = require('express')
import passport = require('passport')
import * as user from '../models/User'
import {User} from "../models/User";
import {signToken} from "../bin/authentication";

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

router.get('/login', passport.authenticate('basic', {session: false}), (req, res, next)=>{
    let tokenData = {
        username: req.user.username,
        roles: req.user.roles,
        email: req.user.email,
        id: req.user.id
    };

    console.log("Login granted. Generating token" );
    let token_signed = signToken(tokenData);

    user.getModel().findOne({email: req.user.email}).then((u: User)=> {
        if (!u.isPasswordTemporary)
            return next({statusCode: 200, error: false, errormessage: "", token: token_signed });
        else
            return next({statusCode: 422, error: true, errormessage: "Please change your temporary password"});
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: err.errormessage});
    });

});

export = router;


