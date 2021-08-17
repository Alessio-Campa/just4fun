import io = require('socket.io')
import {Server} from "http";

let ioServer;

function startSocketIoServer(server: Server): io.Server {
    ioServer = new io.Server(server);

    ioServer.on('connection', function (socket){
        console.log(('the socket id ' + socket.id + " is connected").yellow);
        ioServer.to(socket.id).emit("welcome", "welcome back dear socket " + socket.id);

        socket.on('join', function (room){
            socket.join(room);
            console.log((socket.id + " joined the room " + room).yellow)
            ioServer.to(room).emit("broadcast", "handshake complete");
        });

        socket.on('watching', function (matchID){
            socket.join(matchID + 'watchers');
            console.log((socket.id + " started watching at the match: " + matchID).yellow)
        });

        socket.on('playing', function (matchID){
            /*TODO?: forse da eliminare
                    dato che i giocatori non vedono i messaggi degli spettatori, ha senso
                    mantenerli distinti per motivi di efficienza.
                    Non avrebbe senso notificare i giocatori per un numero, probabilmente grande
                    di messaggi che non potrebbero leggere.
             */
            socket.join(matchID + 'players');
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
