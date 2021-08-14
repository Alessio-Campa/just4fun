import express = require('express');
import auth = require("../bin/authentication");
import * as match from "../models/Match";
import * as matchmaking from "../models/Matchmaking";
import * as user from "../models/User";
import {isMatch, Match} from "../models/Match";
import {isMatchMaking, Matchmaking} from "../models/Matchmaking";

let router = express.Router();

router.get("/", (req, res, next) =>{
    let filter = {}
    if (req.body.player)
        filter["$or"] =  [{player0: req.body.player}, {player1: req.body.player}]
    if (req.body.ended === false || req.body.ended === true)
        if(req.body.ended)
            filter["winner.player"] = {$ne: null}
        else
            filter["winner.player"] = null

    match.getModel().find(filter).then( (data) => {
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.post("/:id", auth, (req, res, next) =>{
    if (req.params.id !== req.user.email)
        next({statusCode: 403, error: true, errormessage: "Forbidden"});

    user.getModel().findOne({email: req.body.player1}).select('_id').lean().then(data => {
        if (!data)
            return next({status_code: 400, error: true, errormessage: "Opponent doesn't exist"})
    })

    let m: Match = match.newMatch(req.user.email, req.body.player1)
    m.save().then((data)=>{
        return res.status(200).json({objectID:data._id})
    }).catch((err)=>{
        return next({status_code: 400, error: true, errormessage: err})
    })
})

router.put("/:idMatch/:id", auth, (req, res, next)=>{
    if (req.params.id !== req.user.email)
        next({statusCode: 403, error: true, errormessage: "Forbidden"});

    match.getModel().findById(req.params.idMatch).then((data) =>{
        let m: Match;
        if (isMatch(data))
            m = data;

        // check if user is player 0 or 1
        if (req.user.username !== m.player0 && req.user.username !== m.player1)
            return next({status_code: 403, error: true, errormessage: "User is not player for this match"})
        m.makeMove(req.user.username, req.body.column);
        m.save().catch((err)=>{
            return next({status_code:400, error:true, errormessage:"An error occurred while saving data: " + err})
        })
    }).then(() => {
        return res.status(200).json({error: false, edit:"Added disk in column: " + req.body.column})
    }).catch((err) => {
        return next({status_code:400, error: true, errormessage: err})
    })
})

router.post("/random", auth, (req, res, next) => {
    if (req.body.user !== req.user.email)
        next({statusCode: 403, error: true, errormessage: "Forbidden"});

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