import express = require('express');
import {express_jwt_auth, passport_auth} from "../bin/authentication";
import * as match from "../models/Match";
import * as matchmaking from "../models/Matchmaking";
import * as user from "../models/User";
import {isMatch, Match} from "../models/Match";
import {isMatchMaking, Matchmaking} from "../models/Matchmaking";
import {getIoServer} from "../bin/socket";
import jwt_decode from "jwt-decode";
import {User} from "../models/User";

let router = express.Router();
let ios = getIoServer();

router.get("/", (req, res, next) =>{
    let limit = parseInt(<string>(req.query.limit || "0")) || 0;
    let filter = {}
    if (req.query.player)
        filter["$or"] = [{player0: req.query.player}, {player1: req.query.player}]
    if (req.query.ended === "true")
        filter["winner.player"] = {$ne: null}
    if (req.query.ended === "false")
        filter["winner.player"] = null

    match.getModel().find(filter).limit(limit).then( (data) => {
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({status_code:500, error:true, errormessage:err.errormessage});
    })
})

router.post("/random", express_jwt_auth, (req, res, next) => {
    if (req.body.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findById(req.user.id, {points:1}).then((data) => {
        let userPoints = data.points;
        matchmaking.getModel().findOne({playerID: req.user.email}).then((alreadyPresent) => {
            if(alreadyPresent)
            {
                return next({status_code: 400, error: false, message: "Matchmaking already started"});
            }
            else
            {
                matchmaking.getModel().create({
                    playerID: req.user.email,
                    min: userPoints,
                    max: userPoints
                }).then((m: Matchmaking) => {
                    m.searchMatch();
                    return next({status_code: 200, error: false, message: "Matchmaking started"});
                }).catch((err) => {
                    return next({status_code: 500, error: true, errormessage: err.errormessage});
                });
            }
        }).catch((err) => {
            return next({status_code: 500, error: true, errormessage: err.errormessage});
        });
    }).catch((err) => {
        return next({status_code: 500, error: true, errormessage: err.errormessage});
    });
})

router.delete("/random", express_jwt_auth, (req, res, next) => {
    if (req.body.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    matchmaking.getModel().deleteMany({playerID: req.user.email}).then(() => {
        return next({status_code: 200, error: false, message: "Matchmaking stopped"});
    }).catch((err) => {
        return next({status_code: 500, error: true, errormessage: err.errormessage});
    });
})

router.get("/:id", passport_auth(['anonymous', 'jwt']), (req, res, next) =>{
    match.getModel().findById(req.params.id).then( (m: Match) => {
        if (req.user) {
            if (req.user.email === m.player0 || req.user.email === m.player1)
                ios.to(req.user.email).emit('readyToPlay', m);
            else
                ios.to(req.user.email).emit('readyToWatch', m);
        }
        return res.status(200).json(m);
    }).catch((err)=> {
        return next({status_code:500, error:true, errormessage:err.message})
    })
})

router.post("/", express_jwt_auth, (req, res, next) => {
    //TODO controllare se opponent è un amico
    if (req.user.email !== req.body.user)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.body.opponent}).then((opponent: User) => {
        if (!opponent)
            return next({status_code: 400, error: true, errormessage: "Opponent doesn't exist"});
        if (!opponent.friends.includes(req.body.user))
            return next({status_code: 400, error: true, errormessage: "Opponent is not your friend"});

        let m: Match = match.newMatch(req.body.user, req.body.opponent, req.body.user);
        m.save().then(() => {
            return next({status_code: 200, error: false, errormessage: "", objectID: m._id})
        }).catch((err) => {
            return next({status_code: 500, error: true, errormessage: err.errormessage})
        });
    });
})

router.post("/:matchID/moves", express_jwt_auth, (req, res, next)=>{
    if (req.body.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    match.getModel().findById(req.params.idMatch).then((m: Match) => {
        if (req.body.user !== m.player0 && req.body.user !== m.player1) // check if user is player 0 or 1
            return next({status_code: 403, error: true, errormessage: "User is not player for this match"});

        try {
            m.makeMove(req.body.user, req.body.column);
        }
        catch (e) {
            return next({status_code:500, error: true, errormessage:e.message});
        }
        m.save().then(() => {
            return next({status_code:200, error: false, edit:"Added disk in column: " + req.body.column});
        }).catch((err) => {
            return next({status_code:500, error: true, errormessage:"An error occurred while saving data: " + err});
        })
    }).catch((err) => {
        return next({status_code:500, error: true, errormessage: err.errormessage});
    });
})

// // TODO: debug, da eliminare
// router.get("/searching", (req, res, next)=>{
//     matchmaking.getModel().find().then(data => {
//         return res.status(200).json(data);
//     })
// })
//
// router.delete("/searching", (req, res, next)=>{
//     matchmaking.getModel().deleteMany().then( () => {
//         return res.status(200).json("done");
//     })
// })

module.exports = router;