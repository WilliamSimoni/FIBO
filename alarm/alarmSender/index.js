//setting environment variables with dotenv
require('dotenv').config({ path: __dirname + './../../.env' });

//env variables
const REDISHOST = process.env.REDISHOST || 'localhost';
const REDISPORT = process.env.REDISPORT || 6379;
const REDISPASS = process.env.REDISPASS || ''
const PORT = process.env.ALARM_MAIN_PORT || 7779;

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const pubsub = require('../pubsub/pubsub');

//CORS middleware

const cors = require('cors');
app.use(cors());
app.options('*', cors());

//array of object, each object is defined as follow: {fleetId, counter} where counter is the number of client connected for that fleet
let fleetCounter = {};

pubsub.client(REDISHOST, REDISPORT, REDISPASS)
  .then(res => {

    http.listen(PORT, function () {
      console.log('listening on ' + PORT);
    });

    const alarm = io.of('/alarm');

    alarm.use(require('./middleware/auth').auth);

    alarm.on('connection', socket => {

      console.log('a user connected');

      //list of fleetId required by client
      let userFleets = [];

      socket.on('addFleet', async (fleet, projectName) => {

        try {

          if (typeof fleet !== 'string' || typeof projectName !== 'string') {
            throw new Error('arguments are not correct');
          }

          if (!socket.decoded.fleetsZdmIds.includes(fleet)) {
            throw new Error('user not allowed');
          }

        } catch (err) {
          socket.emit('Error', err.message);
          return;
        }

        const fleetId = projectName + '-' + fleet;

        try {

          if (!fleetCounter[fleetId]) {

            res.subscribe(fleetId);
            fleetCounter[fleetId] = 1

          } else {

            fleetCounter[fleetId]++;

          }

          userFleets.push(fleetId);

          //adding client to room for that fleet

          socket.join(fleetId);


        } catch (err) {
          console.error(err);
          socket.disconnect(true);
        }
      });

      socket.on('rmFleet', async (fleet, projectName) => {

        try {

          if (typeof fleet !== 'string' || typeof projectName !== 'string') {
            throw new Error('arguments are not correct');
          }

          if (!socket.decoded.fleetsZdmIds.includes(fleet)) {
            throw new Error('user not allowed');
          }

        } catch (err) {
          socket.emit('Error', err.message);
          return;
        }

        const fleetId = projectName + '-' + fleet;

        try {

          const userFleetsIndex = fleetId.indexOf(fleetId);

          if (fleetCounter[fleetId] && userFleetsIndex !== -1) {

            fleetCounter[fleetId]--;

            if (fleetCounter[fleetId] === 0) {
              res.unsubscribe(fleetId);
              delete fleetCounter[fleetId];
            }

            socket.leave(fleetId);

          }

        } catch (err) {
          console.error(err);
          socket.disconnect(true);
        }
      });

      socket.on('disconnect', function () {

        for (let fleetId of userFleets) {

          fleetCounter[fleetId]--;

          if (fleetCounter[fleetId] === 0) {

            res.unsubscribe(fleetId);
            delete fleetCounter[fleetId];

          }

        }

        console.log('A user disconnected');
      });

    });

    res.on("message", (channel, message) => {
      io.of('alarm').to(channel).emit('alarm', message);
    })

  })
  .catch(err => console.error(err));