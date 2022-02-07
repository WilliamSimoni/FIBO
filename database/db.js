const classes = require('extends-classes');

const {InfluxDB} = require('./influxdb');
const{PostgresDB} = require('./postgres');

class Database extends classes(InfluxDB, PostgresDB){
    constructor() {
        if (!Database.instance) {
            super();
            Database.instance = this;
        }
        return Database.instance;
    }
}

exports.Database = Database;