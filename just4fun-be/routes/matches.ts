import express = require('express')
import {isMatch, Match} from "../models/Match";
import * as match from "../models/Match";
import auth = require("../bin/authentication");

let router = express.Router();

router.get("/", (req, res, next) =>{
    // TODO: add filters
    match.getModel().find({}).then( (data) => {
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.post("/", (req, res, next) =>{
    match.getModel().create({
        player0: req.body.player0,
        player1: req.body.player1
    }).then((data)=>{
        return res.status(200).json({objectID:data._id})
    })
})

router.put("/:id", auth, (req, res, next)=>{
    match.getModel().findById(req.params.id).then((data) =>{
        let m: Match;
        if (isMatch(data))
            m = data;
        m.makeMove("a", req.body.column); // TODO: fare in modo che il giocatore venga preso dal token
        m.save().catch((err)=>{
            return next({status_code:400, error:true, errormessage:"An error occurred while saving data: " + err})
        })
    }).then(() => {
        return res.status(200).json({error: false, edit:"Added disk in column: " + req.body.column})
    })
})

module.exports = router;