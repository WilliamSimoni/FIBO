require('dotenv').config({path:__dirname+'/./../.env'});

const { time } = require('../custom-modules/time');

const { PostgresDB } = require('../database/postgres');

const database = new PostgresDB();


async function deleteOldTokens() {
    const now = time.now();
    await database.deleteTokens(now);
}

deleteOldTokens().then(res => {
    console.log('old tokens deleted')
}).catch(err => console.error(err));