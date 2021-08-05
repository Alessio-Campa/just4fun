import express = require('express');
import {isMatch, Match} from "../models/Match";
import * as match from "../models/Match";
import * as user from "../models/User";
import auth = require("../bin/authentication");

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

router.post("/", auth, (req, res, next) =>{
    match.getModel().create({
        player0: req.body.player0,
        player1: req.body.player1
    }).then((data)=>{
        return res.status(200).json({objectID:data._id})
    }).catch((err)=>{
        return next({status_code: 400, error: true, errormessage: err})
    })
})

router.put("/:id", auth, (req, res, next)=>{
    match.getModel().findById(req.params.id).then((data) =>{
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

module.exports = router;