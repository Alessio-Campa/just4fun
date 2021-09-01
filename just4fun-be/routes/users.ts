import express = require('express')
import {isUser, User} from "../models/User";
import * as user from "../models/User";
import { passport_auth } from "../bin/authentication";
import { getIntFromQueryParam } from "../utils/utils";

let router = express.Router();

router.get('/', passport_auth(['jwt', 'anonymous']), (req, res, next) => {
    let filter = {
    isDeleted: { $ne: true }
    }
    let projection = {
        digest:0, //Security reason
        salt:0,   //Security reason
        roles:0,  //Security reason
        isPasswordTemporary:0, //Security reason
        avatar:0,  //Size of response reason
        isDeleted:0  //Deleted user isn't showed
    };
    if(!req.user || !req.user.hasModeratorRole())
    {
        //Information available only to moderator
        projection['following'] = 0;
        projection['friends'] = 0;
        projection['friendRequests'] = 0;
        projection['roles'] = 0;
    }

    let skip = getIntFromQueryParam(req.query.skip, 0);
    let limit = getIntFromQueryParam(req.query.limit, null);
    if (req.query.username)
        filter['username'] = req.query.username;

    user.getModel().find(filter, projection).sort(req.query.order_by).skip(skip).limit(limit).then((users) => {
        return res.status(200).json(users);
    }).catch((err) => {
        return next({statusCode:500, error:true, errormessage:"DB error: "+err.errormessage});
    })
})

router.get('/leaderboard', (req, res, next) => {
    res.redirect(303, '/user?limit=10&order_by=-points');
})

router.get('/:email', passport_auth(['jwt', 'anonymous']), (req, res, next) => {
    let projection = {
        digest:0, //Security reason
        salt:0,   //Security reason
        isDeleted:0,  //Deleted user isn't showed
        isPasswordTemporary:0, //Security reason (if it's your account and the pass is temp you cannot access this page so the information is not relevant)
    };
    if(!req.user || (req.user.email != req.params.email && !req.user.hasModeratorRole()))
    {
        //Information only for owner or moderator
        projection['roles'] = 0;
        projection['following'] = 0;
        projection['friends'] = 0;
        // projection['friendRequests'] = 0;
    }

    if(req.user && (req.user.email == req.params.email || req.user.hasModeratorRole())) {
        user.getModel().findOne({email: req.params.email, isDeleted: { $ne: true }}, projection).then((u: any) => {
            user.getModel().find({friendRequests: req.params.email, isDeleted: { $ne: true }}, {email: 1}).then((friends) => {
                u = u.toJSON();
                u.friendRequestsSent = []
                for(let f in friends)
                    u.friendRequestsSent.push(friends[f].email)
                return res.status(200).json(u);
            }).catch((err) => {
                return next({statusCode: 500, error: true, errormessage: "DB error" + err.errormessage});
            });
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error" + err.errormessage});
        });
    }
    else {
        user.getModel().findOne({email: req.params.email}, projection).then((user) => {
            return res.status(200).json(user);
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error" + err.errormessage});
        });
    }
});

router.post('/', passport_auth(['jwt', 'anonymous']), (req, res, next) => {
    if (!req.body.email || req.body.email === "")
        return next({statusCode:400, error:true, errormessage:"Mail field required"});
    if (!req.body.password || req.body.password === "")
        return next({statusCode:400, error:true, errormessage:"Password field required"});

    let u: User;
    if(req.body.moderator && req.user && req.user.hasModeratorRole()) //Create moderator
    {
        u = user.newUser(req.body.email, req.body.email, "");
        u.setPassword(req.body.password, true);
        u.setModerator(true);
    }
    else
    {
        if (!req.body.name || req.body.name === "")
            return next({statusCode:400, error:true, errormessage:"Name field required"});
        if (req.body.name.includes(' '))
            return next({statusCode:400, error:true, errormessage:"Username cannot contain whitespaces"});
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
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.message});
    })
});

router.delete('/:email', passport_auth('jwt'), (req, res, next)=>{
    if(req.user.hasModeratorRole()) {
        user.getModel().findOne({email: req.params.email}).then((u) => {
            if(!u.hasModeratorRole())
            {
                u.isDeleted = true;
                u.save().then(() => {
                    return res.status(200).json("Deleted successfully");
                }).catch((err)=>{
                    return next({statusCode:500, error: true, errormessage:"DB error"+err});
                });
            }
            else
            {
                return next({statusCode:403, error: true, errormessage:"You cannot delete a moderator"});
            }
        }).catch((err) => {
            return next({statusCode:500, error: true, errormessage:"DB error"+err});
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

    if(req.user.authenticationStrategy !== 'basic' && req.body.password)
        //Prevent password change in case of jwt stolen
        return next({statusCode: 403, error: true, errormessage: "You can update password only with basic auth"});

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
            return res.status(200).json({statusCode: 200, error: false, errormessage: ""});
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
        });
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
});

router.post('/:id/follow', passport_auth('jwt'), (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        data.follow(req.body.user, res, next);
    }).catch((err) => {
        return next({statusCode: 400, error: true, errormessage: "DB error: "+err});
    });
});

router.delete('/:id/follow/:user', passport_auth('jwt'), (req, res, next)=>{
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        data.unfollow(req.params.user, res, next);
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
});

router.post('/:id/friend', passport_auth('jwt'), (req, res, next) => {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.user.email}).then((data) => {
        if(data.friendRequests.includes(req.body.user))
            data.acceptFriendRequest(req.body.user, res, next);
        else {
            data.sendFriendRequest(req.body.user, res, next);
        }
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
})

router.delete('/:user1/friend/:user2', passport_auth('jwt'), (req, res, next) => {
    if (req.params.user1 === req.user.email)
    {
        user.getModel().findOne({email: req.params.user1}).then((data) => {
            if(data.friends.includes(req.params.user2))
                data.removeFriend(req.params.user2, res, next);
            else
                data.removeFriendRequest(req.params.user2, res, next);
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
        });
    }
    else if (req.params.user2 === req.user.email)
    {
        user.getModel().findOne({email: req.params.user2}).then((data) => {
            data.refuseFriendRequest(req.params.user1, res, next)
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
        });
    }
    else
    {
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});
    }
})

router.delete('/:id/notification/:idNot', passport_auth('jwt'), (req, res, next) => {
    if (req.user.email !== req.params.id)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});
    //TODO: potrei dover notificare il client
    user.getModel().findOneAndUpdate({email: req.params.id}, {$pull: {notifications:{_id: req.params.idNot}}} ).then(data => {
        return res.status(200).json('Notification deleted');
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.message});
    })
})

router.post('/:id/invite/:friend', passport_auth('jwt'), (req, res, next) => {
    if (req.user.email !== req.params.id)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});
    if (!req.user.friends.includes(req.params.friend))
        return next({statusCode: 400, error: true, errormessage: "User doesn't exist or isn't your friend"});

    user.getModel().findOne({email: req.params.friend}).then(data => {
        if (data.matchInvites.includes(req.user.email))
            return next({statusCode: 400, error: true, errormessage:"Match invite already sent"})
        data.matchInvites.push(req.user.email);
        data.notify({type: 'invite', content: req.user.email}, false);
        data.save();
        return res.status(200).json('Invite sent');
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.message});
    })
})

router.delete('/:id/invite/:sender', passport_auth('jwt'), (req, res, next) => {
    if (req.user.email !== req.params.id)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOneAndUpdate({email: req.params.id}, {$pull: {matchInvites: req.params.sender}} ).then(data => {
        return res.status(200).json('Invitation deleted');
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err.message});
    })
})


module.exports = router;
