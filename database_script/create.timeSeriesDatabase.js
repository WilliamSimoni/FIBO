require('dotenv').config({path:__dirname+'/./../.env'});

const {InfluxDB} = require('../database/influxdb');

const database = new InfluxDB();

database.createTimeSeriesDatabase()
    .then( res => {
        console.log('database created');
    })
    .catch( err => {
        console.error('database not created')
    })