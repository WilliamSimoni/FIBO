const jwt = require('jsonwebtoken');

const { PostgresDB } = require('../../../database/postgres');

const database = new PostgresDB();

const JWT_KEY = process.env.JWT_KEY;

async function auth(socket, next) {

    if (!socket.handshake.query) {

        return next(new Error('Authentication error'));

    }

    const token = socket.handshake.query.token;

    if (token) {

        jwt.verify(token, JWT_KEY, async (err, decoded) => {

            if (err) return next(new Error('Authentication error'));

            //
            //check if token is in blacklist
            //

            const blacklistTokens = await database.searchTokenInBlackList(token);

            //
            //token is in blacklist
            //

            if (blacklistTokens[0]) {
                return next(new Error('Token is no longer valid'))
            }

            //search user in database
            const usernameSearchResult = await database.searchUserById(decoded.userid);
            //username doesn't exist
            if (!usernameSearchResult[0]) {
                await database.insertTokenInBlackList(token, decoded.exp);
                return next(new Error('Authentication error'));
            }

            socket.decoded = decoded;

            next();

        });

    } else {

        next(new Error('Authentication error'));

    }
}

exports.auth = auth;
