/*
*
*  ENDPOINTS  | METHOD | ATTRIBUTES | DESCRIPTION
* ------------+--------+------------+-------------
*  /          | GET    |     --     | returns list of endpoints
*  /user      | GET    |     --     | returns info of logged user
*  /user      | GET    | ?mail=<s>  | returns info of searched user
*  /user      | DELETE | ?mail=<s>  | deletes user with mail == s
*  /users     | GET    |     --     | returns list of all users
*  /chats     | GET    | ?mail=<s>  | returns list of all direct messages with s as part
*  /matches   | GET    |     --     | returns list of all matches
*  /match     | GET    | ?match=<n> | returns info of match with id == n
*
*
*
*  */

import http = require('http');
import url = require('url');
import fs = require('fs');
import colors = require('colors');

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
        let response_data: object = {
            error: true,
            errormessage: "Invalid endpoint/method"
        };
        let status_code: number = 404;


        if (req.url == "/" && req.method == "GET") {
            status_code = 200;
            response_data = {
                api_version: "0.1",
                endpoints: []
            }
            console.log("200 - Success".green)
        }
        if (req.url == "/users" && req.method == "GET"){
            response_data = {
                users_list: []
            }
            console.log("200 - Success".green)
        }

        res.writeHead(status_code, { "Content-Type": "application/json" });
        res.write(JSON.stringify(response_data), "utf-8");
        res.end();

        console.log("Request end".bold);
    });


})


server.listen( 8080, function() {
    console.log("HTTP Server started on port 8080".bgGreen.black);
});

console.log("Server setup complete".bgGreen.black);