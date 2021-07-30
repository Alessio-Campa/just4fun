import express = require('express')
import mongoose = require('mongoose')
import {isMatch, Match} from "../models/Match";
import * as match from "../models/Match";
//import auth = require("../authentication");

let router = express.Router();

router.get("/", (req, res, next) =>{
    match.getModel().find({}).then( (data) => {
        return res.status(200).json(data);
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.post("/", (req, res, next) =>{
    match.getModel().create({
        player0: req.body.player0,
        player1: req.body.player1,
        winner: {
            player: null,
            positions: null
        },
        turn: 0,
        board: Array(6).fill( Array(7).fill(null) ),
        moves: [],
        matchStart: Date.now(),
        lastMove: Date.now()
    }).then((data)=>{
        return res.status(200).json({objectID:data._id})
    })
})

module.exports = router;