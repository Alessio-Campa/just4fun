import express = require('express')
import {isUser, User} from "../models/User";
import * as user from "../models/User";
import { express_jwt_auth, passport_auth } from "../bin/authentication";
import * as passport from "passport";

let router = express.Router();

//TODO restrict to admins else 403

router.get('/', passport_auth(['anonymous', 'jwt']), (req, res, next) => {
    let projection = {
        digest:0, //Security reason
        salt:0,   //Security reason
        roles:0,  //Security reason
        isPasswordTemporary:0, //Security reason
        avatar:0  //Size of response reason
    };

    user.getModel().find({}, projection).then((users) => {
        return res.status(200).json(users);
    }).catch((err) => {
        return next({statusCode:500, error:true, errormessage:"DB error: "+err.errormessage});
    })
})

router.get('/leaderboard', (req, res, next) => {
    user.getModel().find({}, {digest:0, salt:0, isPasswordTemporary:0, avatar:0}).limit(10).sort({points: -1}).then( (users)=>{
        return res.status(200).json( users );
    }).catch((err) => {
        return next({statusCode:500, error:true, errormessage:"DB error: "+err.errormessage});
    })
})

router.get('/:email', passport_auth(['anonymous', 'jwt']), (req, res, next) => {
    let projection = {
        digest:0, //Security reason
        salt:0,   //Security reason
        isPasswordTemporary:0, //Security reason (if it's your account and the pass is temp you cannot access this page so the information is not relevant)
    };
    if(!req.user || (req.user.email != req.params.email && !(req.user as User).hasModeratorRole()))
    {
        //Information only for owner or moderator
        projection['roles'] = 0;
    }

    user.getModel().findOne({email: req.params.email}, projection).then((user) => {
        return res.status(200).json(user);
    }).catch((err) => {
        return next( {statusCode:500, error: true, errormessage:"DB error"+err.errormessage} );
    });
});

router.post('/', passport_auth(['anonymous', 'jwt']), (req, res, next) => {
    if (!req.body.email || req.body.email === "")
        return next({statusCode:400, error:true, errormessage:"Mail field required"});
    if (!req.body.password || req.body.password === "")
        return next({statusCode:400, error:true, errormessage:"Password field required"});

    let u: User;
    if(req.body.moderator && req.user && (req.user as User).hasModeratorRole()) //Create moderator
    {
        u = user.newUser(req.body.email, "", "");
        u.setPassword(req.body.password, true);
        u.setModerator(true);
    }
    else
    {
        if (!req.body.name || req.body.name === "")
            return next({statusCode:400, error:true, errormessage:"Name field required"});
        if (!req.body.avatar || req.body.avatar === "")
            return next({statusCode:400, error:true, errormessage:"Avatar field required"});

        u = user.newUser(req.body.email, req.body.name, req.body.avatar);
        u.setPassword(req.body.password);
    }

    u.save().then((data) => {
        return next({statusCode: 201, error:false, errormessage:"", _id:data._id});
    }).catch((err) => {
        if (err.code === 11000)
            return next({statusCode: 400, error: true, errormessage: "User already exists"});
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    })
});

router.delete('/:email', passport_auth('jwt'), (req, res, next)=>{
    if((req.user as User).hasModeratorRole()) {
        user.getModel().findOne({email: req.params.email}).then((u) => {
           if(!u.hasModeratorRole())
           {
               u.delete().then(() => {
                   return next({statusCode:200, error: false, errormessage:""});
               }).catch((err)=>{
                   return next({statusCode:500, error: true, errormessage:"DB error"+err.errormessage});
               });
           }
           else
           {
               return next({statusCode:403, error: true, errormessage:"You cannot delete a moderator"});
           }
        }).catch((err) => {
            return next({statusCode:500, error: true, errormessage:"DB error"+err.errormessage});
        });
    }
    else
    {
        return next({statusCode:403, error: true, errormessage:"You must be a moderator"});
    }
});

router.put("/:id", passport_auth(['basic', 'jwt']), (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    let acceptedFields = ['username', 'avatar', 'password'];
    let haveSetAllFields = true;
    user.getModel().findOne({email: req.user.email}).then((u: User) => {
        for (let f in acceptedFields) {
            let field = acceptedFields[f];
            if(req.body.hasOwnProperty(field))
                if(field !== 'password')
                    u[field] = req.body[field];
                else
                    u.setPassword(req.body[field]);
            else
                haveSetAllFields = false;
        }
        if (haveSetAllFields)
            u.isPasswordTemporary = false;
        u.save().then(() => {
            return next({statusCode: 200, error: false, errormessage: ""});
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
        });
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    });
});

router.post('/:id/follow', express_jwt_auth, (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        data.follow(req.body.user, res, next);
    }).catch((err) => {
        return next({statusCode: 400, error: true, errormessage: "DB error: "+err.errormessage});
    });
});

router.delete('/:id/follow', express_jwt_auth, (req, res, next)=>{
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        data.unfollow(req.body.user, res, next);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    });
});

router.post('/:id/friend', express_jwt_auth, (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        data.sendFriendRequest(req.body.user, res, next);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    });
})

router.put('/:id/friend', express_jwt_auth, (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        if (req.body.accept)
            data.acceptFriendRequest(req.body.accept, res, next);
        else if (req.body.refuse)
            data.refuseFriendRequest(req.body.refuse, res, next)
        else
            return next({statusCode: 400, error: true, errormessage: "Specify accept or refuse"});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    });
})

router.delete('/:id/friend', express_jwt_auth, (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        data.removeFriend(req.query.friend.toString(), res, next);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    });
})

module.exports = router;
