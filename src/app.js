const express = require('express');
const userRoute = require('./user/UserRoute');
const db = require('./config/database');
const app = express();

app.use(express.json());

// db.sync({ force: true });
db.authenticate()
  .then(() => console.log('DB connect'))
  .catch((err) => console.log(err));

app.use('/', userRoute);

module.exports = app;
