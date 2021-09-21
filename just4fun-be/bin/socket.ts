import io = require('socket.io')
import {Server} from "http";
import {Chat, getModel, isChat} from "../models/Chat";

let ioServer;

function startSocketIoServer(server: Server): io.Server {
    ioServer = new io.Server(server);

    ioServer.on('connection', function (socket){
        console.log(('the socket id ' + socket.id + " is connected").yellow);

        socket.on('join', function (room){
            socket.join(room);
            console.log((socket.id + " joined the room " + room).yellow)
            ioServer.to(room).emit("broadcast", "handshake complete");
        });

        socket.on('watching', function (matchID){
            socket.join(matchID + 'watchers');
            ioServer.to(socket).emit('broadcast', {subject: 'newMessageReceived'})
            console.log((socket.id + " started watching at the match: " + matchID).yellow)
        });

        socket.on('playing', function (matchID){
            socket.join(matchID + 'players');
            console.log((matchID + 'players'));
            ioServer.to(socket).emit('broadcast', {subject: 'newMessageReceived'})
            console.log((socket.id + " started playing at the match: " + matchID).yellow)
        });
    });

    return ioServer;
}

function getIoServer(){
    return ioServer;
}

function emitMatch(idMatch: string){
    ioServer.emit("Match "+ idMatch)
}

export { startSocketIoServer, getIoServer }
