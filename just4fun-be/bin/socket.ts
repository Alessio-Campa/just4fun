import io = require('socket.io')

function startSocketIoServer(server: Partial<io.ServerOptions>): io.Server
{
    let ioServer = new io.Server(server);

    return ioServer;
}

export { startSocketIoServer }
