import colors = require('colors')
colors.enabled = true;
import express = require('express')
import * as user from '../models/User'
import {User} from "../models/User";
import { signToken, passport_auth} from "../bin/authentication";

let router = express.Router();

router.get("/", (req, res, next)=>{
    next({statusCode: 200, api_version:"1.0", endpoints:["/chat", "/match", "/user"]})
})

router.get('/login', passport_auth('basic'), (req, res, next)=>{
    let tokenData = {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        roles: req.user.roles
    };

    console.log("Login granted. Generating token" );
    let token_signed = signToken(tokenData);

    user.getModel().findOne({email: req.user.email}).then((u: User)=> {
        if (!u.isPasswordTemporary)
            return next({statusCode: 200, error: false, errormessage: "", token: token_signed });
        else
            return next({statusCode: 422, error: true, errormessage: "Please change your temporary password"});
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: err});
    });
});

export = router;


