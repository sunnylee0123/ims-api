require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('./util/log');
const debug = require('debug')('ying-api:server');
const http = require('http');
const { postgresConnect } = require('./services/dbService')

//Routes
const imsRouter = require('./routes/imsRoutes');

const app = express();

//Config
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Routes
app.get('/', function(req, res) {
  logger.info("This is a test info");
  logger.error("This is an error");
  res.json("Hello!");
});
app.use('/ims', imsRouter);

app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(500).send('Something broke!');
});

//Config
const port = process.env.PORT || '8080';
app.set('port', port);
const server = http.createServer(app);
server.listen(port);
postgresConnect(server);

module.exports = server;