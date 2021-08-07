import express = require('express')
import {User} from "../models/User";
import * as user from "../models/User";
import auth = require("../bin/authentication");

let router = express.Router();

//TODO restrict to admins else 403

router.get('/', (req, res, next)=>{
    user.getModel().find({}, {digest:0, salt:0}).then( (users)=>{
        return res.status(200).json( users );
    }).catch( (reason)=>{
        return next({statusCode:404, error:true, errormessage:"DB error: "+ reason});
    })
})

router.post('/', (req, res, next)=>{
    let u = user.newUser( req.body );
    if ( !req.body.password ){
        return next({statusCode:404, error:true, errormessage:"Password field empty"});
    }
    u.setPassword( req.body.password );

    u.save().then( (data=>{
        return res.status(200).json({error:false, errormessage:"", _id:data._id});
    })).catch( (reason)=>{
        if (reason.code === 11000)
            return next( {statusCode:404, error:true, errormessage:"User already exists"} );
        return next( {statusCode:404, error:true, errormessage:"DB error: "+reason.errmsg} );
    })
});

router.get('/:mail', (req, res, next)=>{
    user.getModel().find( {"mail": req.params.mail}, {digest:0, salt:0} ).then( (user)=>{
        return res.status(200).json(user);
    }).catch( (reason)=>{
        return next( {statusCode:404, error: true, errormessage:"DB error"+reason} );
    })
});

router.delete('/:mail', (req, res, next)=>{
    user.getModel().deleteMany( {"mail": req.params.mail} ).then( (user)=>{
        return res.status(200);
    }).catch( (reason)=>{
        return next( {statusCode:404, error: true, errormessage:"DB error"+reason} );
    })
});

module.exports = router;
