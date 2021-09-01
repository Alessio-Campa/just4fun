import express = require('express')
import {isChat, Chat} from "../models/Chat";
import * as chat from "../models/Chat";
import {passport_auth} from "../bin/authentication";
import {getIoServer} from "../bin/socket";
import * as match from "../models/Match";
import {Match} from "../models/Match";
import * as user from "../models/User"
import {getIntFromQueryParam} from "../utils/utils";

let router = express.Router();

router.get("/", passport_auth(['jwt', 'anonymous']), (req, res, next)=>{
    let filter = {};
    let skip = getIntFromQueryParam(req.query.skip, 0);
    let limit = getIntFromQueryParam(req.query.limit, null);

    let projection = {
        messages: 0, //Size of response reason
    }

    if (!req.query.user) {
        filter['members'] = null; //Public default is user not supplied
    }
    else {
        let users;
        if (Array.isArray(req.query.user))
            users = req.query.user;
        else
            users = [req.query.user];

        if (!req.user || !users.includes(req.user.email))
            return next({statusCode: 403, error: true, errormessage: "Forbidden"});

        filter['members'] = {$all: users}; //If chat contains all users in query
    }
    if (req.query.matchID === 'null')
        filter['matchID'] = null;
    else if (req.query.matchID) {
        filter['matchID'] = req.query.matchID;
    }

    chat.getModel().find(filter, projection).sort(req.query.order_by).skip(skip).limit(limit).then(data => {
        return res.status(200).json(data);
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    })
})

router.get("/:chatID", passport_auth(['jwt', 'anonymous']), (req, res, next)=>{
    chat.getModel().findOne({_id: req.params.chatID}).then((data: Chat) => {
        if(data.members !== null && !req.user)
            return next({statusCode: 403, error: true, errormessage: "Forbidden: Without authentication you can only see public chats"});
        else if (req.user && data.members !== null && !data.members.includes(req.user.email))
            return next({statusCode: 403, error: true, errormessage: "Forbidden: This chat is private"});
        else
            return res.status(200).json(data);
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    })
});

router.get("/:chatID/message", passport_auth(['jwt', 'anonymous']), (req, res, next) => {
    let afterTimestamp: number = getIntFromQueryParam(req.query.afterTimestamp, null);
    chat.getModel().findOne({_id: req.params.chatID}).then((data: Chat) => {
        if(data.members !== null && !req.user)
            return next({statusCode: 403, error: true, errormessage: "Forbidden: Without authentication you can only see public chats"});
        else if (req.user && data.members !== null && !data.members.includes(req.user.email))
            return next({statusCode: 403, error: true, errormessage: "Forbidden: This chat is private"});

        if (afterTimestamp)//filter only new messages
        {
            let i = data.messages.length - 1;
            while (i >= 0 && data.messages[i].timestamp > afterTimestamp) --i;
            if (i >= 0 && data.messages[i].timestamp <= afterTimestamp)
                data.messages = data.messages.slice(i+1);
        }
        return res.status(200).json(data.messages);
    }).catch(err => {
        return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
    });
});


router.post("/", passport_auth('jwt'), (req, res, next)=> {
    if (!req.body.members.includes(req.user.email))
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    chat.getModel().count({matchID: null, members:req.body.members},(err, count) => {
        if (count > 0)
            return next({statusCode: 400, error: true, errormessage: "chat already exists"});

        chat.getModel().create({
            matchID: null,
            members: req.body.members,
            messages: []
        }).then((data)=> {
            return res.status(200).json({error: false, object: data})
        }).catch((err)=> {
            return next({statusCode: 500, error: true, errormessage: "DB error: "+err});
        })
    });

})

router.post("/:idChat/message", passport_auth('jwt'), (req, res, next)=> {
    let ios = getIoServer();
    let message = {
        subject: 'newMessageReceived'
    };
    if (req.body.sender !== req.user.email)
        return next({statusCode: 403, error: true, errormessage: "Forbidden"});

    chat.getModel().findById(req.params.idChat).then((c: Chat) => {
        c.messages.push({
            sender: req.body.sender,
            text: req.body.text,
            timestamp: Date.now()
        })
        c.save().then((c: Chat) => {
            if (c.matchID) {
                ios.to(c.matchID + 'watchers').emit('broadcast', message);
                console.log("notifying watchers of " + c.matchID);
                
        if (c.matchID) {
            ios.to(c.matchID + 'watchers').emit('newMessageReceived', message);
            console.log("notifying watchers of " + c.matchID);
                //notify users
                let others = c.members.filter(x => x != req.body.sender)
                user.getModel().find({email: {$in: others}}).then(data => {
                        u.notify({type:'message', content: req.body.sender})
                    data.forEach(u => {
                    })
                })

            match.getModel().findOne({_id: c.matchID}).then((data:Match) => {
                if (req.body.sender === data.player0 || req.body.sender === data.player1) {
                    console.log("notifying players of " + c.matchID);
                    ios.to(c.matchID + 'players').emit('newMessageReceived', message);
                }
            });
        }
        else {
            //let receiver = (c.members[1] === req.body.sender) ? c.members[0] : c.members[1];
            for (let i in c.members) {
                    ios.to(c.members[i]).emit('newMessageReceived', message);
                    console.log("notifying " + c.members[i]);
                }
        }
        return res.status(200).json({error: false, message: "Object created"})
    }).catch((err) => {
        return next({statusCode: 500, error: true, errormessage: "DB error: " + err});
    })
})

module.exports = router;