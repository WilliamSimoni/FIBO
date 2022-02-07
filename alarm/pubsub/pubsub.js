

const Redis = require("ioredis");

let client = async (host, port, password) => {
    return new Redis({
        port: port, // Redis port
        host: host, // Redis host
        password: password, //password to access Redis
        db: 0,
      });
};

let publishAlarm = (alarm, fleet) => {
    return new Promise((resolve, reject) => {
        client().then(
            res => {
                res
                    .multi()
                    .publish(fleet,JSON.stringify(alarm))
                    .execAsync()
                    .then(
                        res => {
                            resolve(res);
                        },
                        err => {
                            reject(err);
                        }
                    );
            },
            err => {
                reject("Redis connection failed: " + err);
            }
        );
    });
};

exports.client = client;
exports.publishAlarm = publishAlarm;