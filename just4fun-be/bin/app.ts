import express = require('express');
import logger = require('morgan');
import path = require('path');
import cookieParser = require('cookie-parser');
import bodyparser = require('body-parser')

let matchRouter = require('../routes/matches');
let chatRouter = require('../routes/chats');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(cors());
app.use(bodyparser.json());


// app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/match', matchRouter);
app.use('/chat', chatRouter);
// app.use('/books', booksRouter);


export { app }