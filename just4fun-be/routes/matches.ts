import express = require('express');
import {passport_auth} from "../bin/authentication";
import * as match from "../models/Match";
import * as matchmaking from "../models/Matchmaking";
import * as user from "../models/User";
import {Match} from "../models/Match";
import {Matchmaking} from "../models/Matchmaking";
import {getIoServer} from "../bin/socket";
import {User} from "../models/User";
import {getIntFromQueryParam} from "../utils/utils";
import {Chat, newChat} from "../models/Chat";

let router = express.Router();

router.get("/", (req, res, next) => {
    let skip = getIntFromQueryParam(req.query.skip, 0);
    let limit = getIntFromQueryParam(req.query.limit, null);
    let filter = {}

    if (req.query.player)
        filter["$or"] = [{player0: req.query.player}, {player1: req.query.player}]
    if (req.query.ended === "true")
        filter["winner.player"] = {$ne: null}
    if (req.query.ended === "false")
        filter["winner.player"] = null

    if(!req.query.order_by)
        req.query.order_by = '-lastMove';

    match.getModel().find(filter).sort(req.query.order_by).limit(limit).skip(skip).then( (data) => {
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    })
})

router.get("/:id", passport_auth(['jwt', 'anonymous']), (req, res, next) =>{
    let ios  = getIoServer();
    match.getModel().findById(req.params.id).then( (m: Match) => {
        if (req.user) {
            if (req.user.email === m.player0 || req.user.email === m.player1)
                ios.to(req.user.email).emit('readyToPlay', m);
            else
                ios.to(req.user.email).emit('readyToWatch', m);
        }
        return res.status(200).json(m);
    }).catch((err)=> {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    })
})

router.post("/random", passport_auth('jwt'), (req, res, next) => {
    if (req.body.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findById(req.user.id, {points:1}).then((data) => {
        let userPoints = data.points;
        matchmaking.getModel().findOne({playerID: req.user.email}).then((alreadyPresent) => {
            if(alreadyPresent)
            {
                return next({statusCode: 400, error: true, message: "Matchmaking already started"});
            }
            else
            {
                matchmaking.getModel().create({
                    playerID: req.user.email,
                    min: userPoints,
                    max: userPoints
                }).then((m: Matchmaking) => {
                    m.searchMatch();
                    return res.status(200).json({statusCode: 200, error: false, message: "Matchmaking started"});
                }).catch((err) => {
                    return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
                });
            }
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
        });
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
})

router.delete("/random", passport_auth('jwt'), (req, res, next) => {
    if (req.query.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    matchmaking.getModel().deleteMany({playerID: req.user.email}).then(() => {
        return res.status(200).json({message: "Matchmaking stopped"});
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
})

router.post("/", passport_auth('jwt'), (req, res, next) => {
    if (req.user.email !== req.body.user)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.body.opponent}).then((opponent: User) => {
        if (!opponent)
            return next({statusCode: 400, error: true, errormessage: "Opponent doesn't exist"});
        if (!opponent.friends.includes(req.body.user))
            return next({statusCode: 400, error: true, errormessage: "Opponent is not your friend"});

        let m: Match = match.newMatch(req.body.user, req.body.opponent);
        m.save().then(() => {
            let c: Chat = newChat(m._id, null);
            c.save().then(() => {
                opponent.notify({type: 'acceptedInvite', content: {opponent: req.body.user, matchID: m._id}})
                return res.status(200).json({matchID: m._id})
            }).catch((err) => {
                return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
            })
        }).catch((err) => {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
        });
    });
})

router.post("/:matchID/moves", passport_auth('jwt'), (req, res, next)=>{
    if (req.body.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    match.getModel().findById(req.params.matchID).then((m: Match) => {
        if (req.body.user !== m.player0 && req.body.user !== m.player1) // check if user is player 0 or 1
            return next({statusCode: 403, error: true, errormessage: "User is not player for this match"});

        try {
            m.makeMove(req.body.user, req.body.column);
        }
        catch (e) {
            return next({statusCode:500, error: true, errormessage:e.message});
        }

        m.save().then(() => {
            return res.status(200).json({error: false, edit:"Added disk in column: " + req.body.column})
        }).catch((err) => {
            return next({statusCode:500, error: true, errormessage:"An error occurred while saving data: " + err});
        })
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
})

module.exports = router;