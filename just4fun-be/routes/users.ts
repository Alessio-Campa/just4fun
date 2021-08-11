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

router.get('/:mail', (req, res, next)=>{
    user.getModel().find( {"mail": req.params.mail}, {digest:0, salt:0} ).then( (user)=>{
        return res.status(200).json(user);
    }).catch( (reason)=>{
        return next( {statusCode:500, error: true, errormessage:"DB error"+reason} );
    })
});

router.post('/', (req, res, next) => {
    if (!req.body.mail || req.body.mail === ""){
        return next({statusCode:400, error:true, errormessage:"Mail field required"});
    }
    if (!req.body.name || req.body.name === ""){
        return next({statusCode:400, error:true, errormessage:"Name field required"});
    }
    if (!req.body.password || req.body.password === ""){
        return next({statusCode:400, error:true, errormessage:"Password field required"});
    }

    let u = user.newUser( req.body.mail, req.body.name );
    u.setPassword( req.body.password );

    u.save().then( (data=>{
        return res.status(200).json({error:false, errormessage:"", _id:data._id});
    })).catch( (reason)=>{
        if (reason.code === 11000)
            return next( {statusCode: 400, error: true, errormessage: "User already exists"} );
        return next( {statusCode: 500, error: true, errormessage: "DB error: "+reason.errmsg} );
    })
});

router.delete('/:mail', (req, res, next)=>{
    user.getModel().deleteMany( {"mail": req.params.mail} ).then( (user)=>{
        return res.status(200);
    }).catch( (reason)=>{
        return next( {statusCode:500, error: true, errormessage:"DB error"+reason} );
    })
});

router.put("/", auth, (req, res, next) => {
    user.getModel().findOne({mail: req.user.mail}).then( async data => {
        let out;
        // TODO: eliminare questo in seguito che serve per debug al momento
        if (req.body.resetFriends)
            data.friends = [];
        else if (req.body.points)
            data.points += req.body.points;
        else if (req.body.follow)
            out = await data.follow(req.body.follow);
        else if (req.body.friend)
            out = await data.sendFriendRequest(req.body.friend)
        else if (req.body.accept)
            out = data.acceptFriendRequest(req.body.accept)
        else
            out = {statusCode: 400, error: true, errormessage: "Bad request"}

        if (out)
            return next(out);

        data.save().catch((err)=>{
            return next({status_code:400, error:true, errormessage:"An error occurred while saving data: " + err})
        })

        return res.status(200).json("Update successful")
    }).catch(err => {
        return next({statusCode: 400, error: true, errormessage: err})
    })
})

module.exports = router;
