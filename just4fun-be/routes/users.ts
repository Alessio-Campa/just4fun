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
        return next({statusCode:500, error:true, errormessage:"DB error: "+ reason});
    })
})

router.get('/:email', (req, res, next)=>{
    user.getModel().find( {"email": req.params.email}, {digest:0, salt:0} ).then( (user)=>{
        return res.status(200).json(user);
    }).catch( (reason)=>{
        return next( {statusCode:500, error: true, errormessage:"DB error"+reason} );
    })
});

router.post('/', (req, res, next) => {
    if (!req.body.email || req.body.email === ""){
        return next({statusCode:400, error:true, errormessage:"Mail field required"});
    }
    if (!req.body.name || req.body.name === ""){
        return next({statusCode:400, error:true, errormessage:"Name field required"});
    }
    if (!req.body.password || req.body.password === ""){
        return next({statusCode:400, error:true, errormessage:"Password field required"});
    }

    let u = user.newUser( req.body.email, req.body.name );
    u.setPassword( req.body.password );

    u.save().then( (data=>{
        return res.status(200).json({error:false, errormessage:"", _id:data._id});
    })).catch( (reason)=>{
        if (reason.code === 11000)
            return next( {statusCode: 400, error: true, errormessage: "User already exists"} );
        return next( {statusCode: 500, error: true, errormessage: "DB error: "+reason.errmsg} );
    })
});

router.delete('/:email', auth, (req, res, next)=>{
    // TODO: handle authorization
    user.getModel().deleteMany( {email: req.params.email} ).then( (user)=>{
        return res.status(200);
    }).catch( (reason)=>{
        return next( {statusCode:500, error: true, errormessage:"DB error"+reason} );
    })
});

router.put("/:id", auth, (req, res, next) => {
    if (req.params.id !== req.user.email)
        next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then( async data => {
        // TODO: eliminare questo in seguito che serve per debug
        if (req.body.resetFriends) {
            data.friends = [];
            data.following = [];
            data.save();
            next({statusCode: 200, error: false, errormessage: ""});
        }
        // TODO: togliere da qua in seguito
        else if (req.body.points) {
            data.updatePoints(req.body.points, res, next)
        }
        else if (req.body.friend)
            data.sendFriendRequest(req.body.friend, res, next)
        else if (req.body.accept)
            out = data.acceptFriendRequest(req.body.accept)
        else
            next({statusCode: 400, error: true, errormessage: "Bad request"});
    }).catch(err => {
        return next({statusCode: 400, error: true, errormessage: err})
    })
})

module.exports = router;
