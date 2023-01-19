/* eslint-disable no-unused-vars */
require('dotenv').config();
const express = require('express');

// const db = require('./connection/database');
const ErrorMiddleware = require('./middlewares/ErrorHandler');
const i18nMiddleware = require('./middlewares/i18nMiddleware');
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRouter');
const todosRoute = require('./routes/todoRoute');

const app = express();

// db.sync({ force: true });
// db.authenticate()
//   .then(() => console.log('DB connect in ', process.env.NODE_ENV + ' mode'))
//   .catch((err) => console.log(err));

app.use(express.json());
app.use(i18nMiddleware);
app.use('/api/1.0/users', userRoute);
app.use('/api/1.0/auth', authRoute);
app.use('/api/1.0/todos', todosRoute);

app.use(ErrorMiddleware);

module.exports = app;
