import express = require('express');
import logger = require('morgan');
import path = require('path');
import cookieParser = require('cookie-parser');
import bodyparser = require('body-parser')

let matchRouter = require('../routes/matches');
let chatRouter = require('../routes/chats');
let userRouter = require('../routes/users');
let indexRouter = require('../routes/index');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(cors());
app.use(bodyparser.json());

app.use('/user', userRouter);
app.use('/match', matchRouter);
app.use('/chat', chatRouter);
app.use('/', indexRouter);
// app.use('/books', booksRouter);

app.use( function (err, req, res, next) {
    console.log("Request error: ".red + JSON.stringify( err ));
    res.status(err.statusCode || 500).json( err );
})
app.use( (req, res, next) => {
    res.status(404).json({statusCode:404, error:true, errormessage:"Invalid endpoint"});
})


export { app }