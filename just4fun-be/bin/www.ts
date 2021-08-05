require('dotenv').config()

import { app } from './app'
import { AddressInfo } from "net";
import http = require('http')
import colors = require('colors'); colors.enabled = true;
import * as mongoose from "mongoose";
import * as match from "../models/Match";

// Create HTTP server
let port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http.createServer(app);

// Initilize socket.io


mongoose.connect( `mongodb://${process.env.DB_NAME}:${process.env.DB_PASS}@54.38.158.223:27017/just4fun`, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log("Connected to MongoDB".bgGreen.black);
    return match.getModel().countDocuments({}); // We explicitly return a promise here
}).then(()=>{
    server.listen(port,  ()=> console.log( ("HTTP Server started on port "+port).bgGreen.black) );
})
server.on('error', onError);
server.on('listening', onListening);



/**
 * Event listener for HTTP server "error" event
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = getBind(server.address())

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event
 */
function onListening() {
    debug('Listening on ' + getBind(server.address()));
}

function getBind(address: string | AddressInfo): string
{
    return typeof address === 'string'
        ? 'pipe ' + address
        : 'port ' + address.port;
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}
