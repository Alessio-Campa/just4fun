import io = require('socket.io')
import {Server} from "http";

let ioServer;

function startSocketIoServer(server: Server): io.Server {
    ioServer = new io.Server(server);

    ioServer.on('connection', function(socket){
        console.log(('the socket id ' + socket.id + " is connected").yellow);
        ioServer.to(socket.id).emit("welcome", "welcome back dear socket " + socket.id);

        socket.on('join', function(room){
            socket.join(room);
            console.log((socket.id + " joined the room " + room).yellow)
            ioServer.to(room).emit("broadcast", "handshake complete");
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
