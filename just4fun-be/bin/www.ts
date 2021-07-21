require('dotenv').config()

import { app } from './app'

import http = require('http')
import { AddressInfo } from "net";
// import io = require('socket.io')
// import mongoose = require('mongoose')
let debug = require('debug')('just4fun-be')


//Create HTTP server
let port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

let server = http.createServer(app);
server.listen(port);
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