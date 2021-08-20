import express = require('express')
import {isChat, Chat} from "../models/Chat";
import * as chat from "../models/Chat";
import { express_jwt_auth } from "../bin/authentication";
import jwt_decode from "jwt-decode"
import {User} from "../models/User";

let router = express.Router();

router.get("/", express_jwt_auth, (req, res, next)=>{
    chat.getModel().find().then(data => {
        return res.status(200).json(data)
    }).catch(err => {
        return next({status_code: 400, error: true, errormessage: err})
    })
    /*
    chat.getModel().findOne({matchID: null, members: {$all: [req.user.id, req.body.friend]}} ).then((data) => {
        return res.status(200).json(data);
    }).catch((err) => {
        return next({status_code: 400, error: true, errormessage: err})
    })
     */
})

router.get("/:matchID", (req, res, next)=> {
    let user;
    //optional authentication with bearer token
    if( req.headers['authorization'] !== undefined ){
        let token: User = jwt_decode(req.headers.authorization.split(" ")[1])
        user = token.id
    }

    chat.getModel().findOne({matchID: req.params.matchID}).then( (data)=> {
        // TODO: ritornare messaggi in base chi sei (giocatore o fuori)
        return res.status(200).json( data );
    }).catch((err)=> {
        return next({status_code: 400, error: true, errormessage: err})
    })
})

router.post("/:id", express_jwt_auth, (req, res, next)=> {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    chat.getModel().create({
        matchID: req.body.matchID,
        members: [req.body.friend, req.user.email],
        messages: []
    }).then((data)=> {
        return res.status(200).json({error: false, objectId: data._id})
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.put("/:idChat/message", express_jwt_auth, (req, res, next)=> {
    if (req.body.sender !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    chat.getModel().findById(req.params.idChat).then((data)=> {
        let c: Chat;
        if (isChat(data)) c = data;
        c.messages.push({
            sender: req.body.sender,
            text: req.body.text,
            timestamp: Date.now()
        })
        data.save()
    }).then(() => {
        return res.status(200).json({error: false, message: "Object created"})
    }).catch((err) => {
        return next({status_code: 400, error: true, errormessage: err.message})
    })
})

// Chat deletio
// TODO?: da eliminare
router.delete("/:id", (req, res, next)=> {
    chat.getModel().findByIdAndDelete(req.params.id).then(()=>{
        return res.status(200).json({error: false, message:"object deleted succesfully"})
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

module.exports = router;