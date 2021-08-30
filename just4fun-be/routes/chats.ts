import express = require('express')
import {isChat, Chat} from "../models/Chat";
import * as chat from "../models/Chat";
import {passport_auth} from "../bin/authentication";
import {getIoServer} from "../bin/socket";
import * as match from "../models/Match";
import {Match} from "../models/Match";
import {getIntFromQueryParam} from "../utils/utils";

let router = express.Router();

router.get("/", passport_auth(['jwt']), (req, res, next)=>{
    let filter = {};

    if (req.query.user)
        filter['members'] = req.query.user;

    if (req.query.matchID === 'null')
        filter['matchID'] = null;
    else if (req.query.matchID)
        filter['matchID'] = req.query.matchID;
    // TODO: controllare che ci sia almeno 1, roba di campa.

    chat.getModel().find(filter).then(data => {
        data.forEach( (e: Chat) => {
            if ( (e.members[0] == req.user.email && !req.user.friends.includes(e.members[1])) || (e.members[1] == req.user.email && !req.user.friends.includes(e.members[0])) ){
                let idx = data.indexOf(e);
                data.splice(idx, 1);
            }
        })
        return res.status(200).json(data)
    }).catch(err => {
        return next({status_code: 500, error: true, errormessage: err.message})
    })
})

router.get("/:chatID", passport_auth('jwt'), (req, res, next)=>{
    chat.getModel().findOne({_id: req.params.chatID}).then(data => {
        return res.status(200).json(data)
    }).catch(err => {
        return next({status_code: 500, error: true, errormessage: err})
    })
});

router.get("/:chatID/message", passport_auth('jwt'), (req, res, next) => {
    // if (!req.query.timestamp)
    //     return next({status_code: 400, error: true, errormessage:'timestamp missing'});

    let lastTimestamp: number = getIntFromQueryParam(req.query.afterTimestamp, null);
    chat.getModel().findOne({_id: req.params.chatID}).then((data: Chat) => {
        if (lastTimestamp)
        {
            let i = data.messages.length - 1;
            while (i > 0 && data.messages[i].timestamp > lastTimestamp) {
                --i;
            }
            data.messages = data.messages.slice(i);
        }
        return res.status(200).json(data.messages);
    }).catch(err => {
        return next({status_code: 500, error: true, errormessage: err});
    });
});


router.post("/:id", passport_auth('jwt'), (req, res, next)=> {
    if (req.params.id !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    chat.getModel().count({matchID: null, members:[req.body.friend, req.user.email]},(err, count) => {
        if (!req.body.matchID && count > 0)
            return next({statusCode: 400, error: true, errormessage: "chat already exists"});

        chat.getModel().create({
            matchID: req.body.matchID,
            members: [req.body.friend, req.user.email],
            messages: []
        }).then((data)=> {
            return res.status(200).json({error: false, object: data})
        }).catch((err)=> {
            return next({status_code:500, error:true, errormessage:err})
        })
    });

})

router.post("/:idChat/message", passport_auth('jwt'), (req, res, next)=> {
    let ios = getIoServer();
    let c: Chat;
    let message = {
        subject: 'newMessageReceived'
        // TODO: potrei aggiungere nuove info, ma non roba sensibile
    };
    if (req.body.sender !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    chat.getModel().findById(req.params.idChat).then((data)=> {
        if (isChat(data)) c = data;
        c.messages.push({
            sender: req.body.sender,
            text: req.body.text,
            timestamp: Date.now()
        })
        data.save();

    }).then(() => {
        if (c.matchID) {
            ios.to(c.matchID + 'watchers').emit('broadcast', message);
            console.log("notifying watchers of " + c.matchID);

            match.getModel().findOne({_id: c.matchID}).then((data:Match) => {
                if (req.body.sender === data.player0 || req.body.sender === data.player1) {
                    console.log("notifying players of " + c.matchID);
                    ios.to(c.matchID + 'players').emit('broadcast', message);
                }
            });
        }
        else {
            //let receiver = (c.members[1] === req.body.sender) ? c.members[0] : c.members[1];
            ios.to(c.members[0]).emit('broadcast', message);
            ios.to(c.members[1]).emit('broadcast', message);
            console.log("notifying " + c.members[0]);
            console.log("notifying " + c.members[1]);
        }
        return res.status(200).json({error: false, message: "Object created"})
    }).catch((err) => {
        return next({status_code: 500, error: true, errormessage: err.message})
    })
})

// Chat deletion
// TODO?: da eliminare
router.delete("/:id", (req, res, next)=> {
    chat.getModel().findByIdAndDelete(req.params.id).then(()=>{
        return res.status(200).json({error: false, message:"object deleted succesfully"})
    }).catch((err)=> {
        return next({status_code:500, error:true, errormessage:err})
    })
})

module.exports = router;