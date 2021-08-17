import express = require('express');
import auth = require("../bin/authentication");
import * as match from "../models/Match";
import * as matchmaking from "../models/Matchmaking";
import * as user from "../models/User";
import {isMatch, Match} from "../models/Match";
import {isMatchMaking, Matchmaking} from "../models/Matchmaking";
import {getIoServer} from "../bin/socket";
import jwt_decode from "jwt-decode";
import {User} from "../models/User";

let router = express.Router();

router.get("/", (req, res, next) =>{
    let limit = parseInt( <string>(req.query.limit || "0") ) || 0;
    let filter = {}
    if (req.query.player)
        filter["$or"] =  [{player0: req.query.player}, {player1: req.query.player}]
    if (req.query.ended === "true")
        filter["winner.player"] = {$ne: null}
    if (req.query.ended === "false")
        filter["winner.player"] = null

    match.getModel().find(filter).limit(limit).then( (data) => {
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.post("/random", auth, (req, res, next) => {
    if (req.body.user !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    let userPoints;
    user.getModel().findById(req.user.id, {points:1}).then((data)=>{
        userPoints = data.points;
    }).then(()=>{
        matchmaking.getModel().create({
            playerID: req.user.email,
            min: userPoints,
            max: userPoints
        }).then((data)=>{
            let m: Matchmaking;
            if (isMatchMaking(data)) m = data;
            m.searchMatch();
        }).then(()=>{
            return res.status(200).json({error: false, message: "Matchmaking started"})
        }).catch((err) => {
            return next({status_code: 400, error: true, errormessage: err})
        })
    }).catch((err) => {
        return next({status_code: 400, error: true, errormessage: err})
    })
})

router.get("/:id", (req, res, next) =>{
    match.getModel().findById(req.params.id).then( (data) => {
        let ios = getIoServer();
        let u: User = req.headers.authorization ? jwt_decode(req.headers.authorization.split(' ')[1]) : null;
        let m: Match;
        if (isMatch(data))
            m = data;
        console.log(u);
        if (u) {
            if (u.email === m.player0 || u.email === m.player1)
                ios.to(req.user.email).emit('readyToPlay', m);
            else
                ios.to(req.user.email).emit('readyToWatch', m);
        }
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err.message})
    })
})

router.post("/:id", auth, (req, res, next) =>{
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.body.player1}).select('_id').lean().then(data => {
        if (!data)
            return next({status_code: 400, error: true, errormessage: "Opponent doesn't exist"})
    })

    let m: Match = match.newMatch(req.user.email, req.body.player1, next)
    return res.status(200).json({objectID:m._id});
})

router.put("/:idMatch/:id", auth, (req, res, next)=>{
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    match.getModel().findById(req.params.idMatch).then((data) =>{
        let m: Match;
        if (isMatch(data))
            m = data;

        // check if user is player 0 or 1
        if (req.user.email !== m.player0 && req.user.email !== m.player1)
            return next({status_code: 403, error: true, errormessage: "User is not player for this match"})
        m.makeMove(req.user.email, req.body.column);
        m.save().catch((err)=>{
            return next({status_code:400, error:true, errormessage:"An error occurred while saving data: " + err})
        })
    }).then(() => {
        return res.status(200).json({error: false, edit:"Added disk in column: " + req.body.column})
    }).catch((err) => {
        return next({status_code:400, error: true, errormessage: err.message})
    })
})

// TODO: debug, da eliminare
router.get("/searching", (req, res, next)=>{
    matchmaking.getModel().find().then(data => {
        return res.status(200).json(data);
    })
})

router.delete("/searching", (req, res, next)=>{
    matchmaking.getModel().deleteMany().then( () => {
        return res.status(200).json("done");
    })
})

module.exports = router;