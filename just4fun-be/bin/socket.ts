import io = require('socket.io')
import {Server} from "http";

let ioServer;

function startSocketIoServer(server: Server): io.Server {
    //ioServer = new io.Server(server);
    // @ts-ignore
    ioServer = io(server);

    ioServer.on('connection', function(socket){
        console.log('connection',socket.id);
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
