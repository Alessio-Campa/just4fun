import express = require('express')
import {isChat, Chat} from "../models/Chat";
import * as chat from "../models/Chat";
import {Model} from "mongoose";
//import auth = require("../authentication");


let router = express.Router();

router.get("/", (req, res, next)=> {
    chat.getModel().find({}).then( (data)=> {
        return res.status(200).json( data );
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.post("/", (req, res, next)=> {
    chat.getModel().create({
        idMatch: req.body.idMatch,
        members: req.body.members,
        messages: []
    }).then((data)=> {
        return res.status(200).json({error: false, objectId: data._id})
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

router.put("/:id", (req, res, next)=> {
    console.log(req.params.id)
    chat.getModel().findById(req.params.id).then((data)=> {
        let c: Chat;
        if (isChat(data)) c = data;
        c.messages.push({
            sender: req.body.sender,
            text: req.body.text,
            timestamp: Date.now()
        })
        data.save()
    }).then((data)=> {
        return res.status(200).json("DONE")
    })
})

// Chat deletion
router.delete("/:id", (req, res, next)=> {
    chat.getModel().findByIdAndDelete(req.params.id).then(()=>{
        return res.status(200).json({error: false, message:"object deleted succesfully"})
    }).catch((err)=> {
        return next({status_code:400, error:true, errormessage:err})
    })
})

// TODO ? :Message deletion


module.exports = router;