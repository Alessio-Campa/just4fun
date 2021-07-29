import http = require('http');
import url = require('url');
import fs = require('fs');
import colors = require('colors');

import {isMatch, Match} from "../models/Match";
import {isChat, Chat} from "../models/Chat";
import {isMessage, Message} from "../models/Message";

import * as match from "../models/Match"
import * as chat from "../models/Chat"
import * as message from "../models/Message"
import * as mongoose from "mongoose";

colors.enabled = true;

let server = http.createServer( function (req, res){
    console.log("New server connection".inverse);
    console.log("REQUEST:".bold)
    console.log("      URL: ".cyan + req.url );
    console.log("   METHOD: ".cyan + req.method );
    console.log("  Headers: ".cyan + JSON.stringify( req.headers ) );

    let body: string = "";

    req.on("data", function( chunk ) {
        body = body + chunk;

    }).on("end", function() {
        let respond = function( status_code: number, response_data: Object ) : void {
            res.writeHead(status_code, { "Content-Type": "application/json" });
            res.write(JSON.stringify(response_data), "utf-8");
            res.end();
        }
        if (req.url == "/match" && req.method == "GET"){
            match.getModel().find({}).then( (data) => {
                respond(200, data)
            }).catch((err)=>{
                respond(404, {"error": err})
            })
        }
        if (req.url == "/match1" && req.method == "PUT"){
            let a;
            match.getModel().findOne({}).then((data) =>{
                a = data
                a.makeMove("b", 0)
                a.save()
            }).then(() => {
                return respond(200, {HE: "LO"})
            })
        }
        if (req.url == "/match0" && req.method == "PUT"){
            match.getModel().findOne({}).then((data) =>{
                let a: Match;
                if(isMatch(data)){
                    a = data
                }
            }).then(() => {
                return respond(200, {HE: "LO"})
            })
        }
        if (req.url == "/match" && req.method == "POST"){
            match.getModel().create({
                player0: "a",
                player1: "b",
                winner: {
                    player: null,
                    positions: null
                },
                turn: 0,
                board: Array(6).fill( Array(7).fill(null) ),
                moves: [],
                matchStart: Date.now(),
                lastMove: Date.now()
            }).then(()=>{
                return respond(200, "object created")
            })
        }
        if(req.url == "/chat" && req.method == "POST"){
            chat.getModel().create({
                idMatch: null,
                members: ["a"],
                messages: []
            }).then(r => {
                return respond(200, "object created")
            })
        }
        if(req.url == "/chat" && req.method == "GET"){
            chat.getModel().find({}).then((data)=> {
                return respond(200, data);
            })
        }
        if(req.url == "/message" && req.method == "POST"){
            message.getModel().create({
                sender: "c",
                text: "Test3",
                timestamp: Date.now()
            }).then(r => {
                chat.getModel().findOne({}).then(data => {
                    let d;
                    d = data
                    d.messages.push(r);
                    d.save()
                }).then(() => {
                    message.getModel().findOneAndDelete({_id: r._id}).then(()=>{
                        return respond(200, "object created");
                    });
                })
            })
        }
        if(req.url == "/message" && req.method == "GET"){
            message.getModel().find({}).then((data)=> {
                return respond(200, data);
            })
        }



        console.log("Request end".bold);
    });


})

mongoose.connect( `mongodb://just4fun:${encodeURIComponent("@Just@4@FUN@")}@54.38.158.223:27017/just4fun`, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {

        console.log("Connected to MongoDB".bgGreen.black);
        return match.getModel().countDocuments({}); // We explicitly return a promise here
    }
).then((c) => {
    if (c == 0){
        let a = match.getModel().create({
            player0: "a",
            player1: "b",
            winner: {
                player: null,
                positions: null
            },
            turn: 0,
            board: Array(6).fill( Array(7).fill(null) ),
            moves: [],
            matchStart: Date.now(),
            lastMove: Date.now(),
        })
        return Promise.all([a]);
    }

}).then(() => {
    return new Promise( (resolve, reject) => {
        server.listen(3000, function () {
            console.log("HTTP Server started on port 8080".bgGreen.black);
            resolve(0);
        });
        server.on('error', (e) => { reject(e); } );
    });
})

