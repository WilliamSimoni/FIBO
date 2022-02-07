let jwt = require('jsonwebtoken');
const { Database } = require('../../database/db');

const database = new Database();

const JWT_KEY = process.env.JWT_KEY;
const JWT_KEY_SUPERUSER = process.env.JWT_KEY_SUPERUSER;

async function checkToken(request, response, next) {
    let token = request.headers['x-access-token'] || request.headers['authorization']; // Express headers are auto converted to lowercase
    if (token) {
        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        jwt.verify(token, JWT_KEY, async (err, decoded) => {
            try {
                if (err) {
                    return response.status(480).json({
                        status: 480,
                        errors: ['Token is not valid']
                    });
                } else {

                    //
                    //check if token is in blacklist
                    //

                    const blacklistTokens = await database.searchTokenInBlackList(token);

                    //
                    //token is in blacklist
                    //

                    if (blacklistTokens[0]) {
                        return response.status(481).json({
                            status: 481,
                            errors: ['token is no longer valid']
                        });
                    }
                    
                    //search user in database
                    const usernameSearchResult = await database.searchUserById(decoded.userid);
                    //username doesn't exist
                    if (!usernameSearchResult[0]) {
                        await database.insertTokenInBlackList(token, decoded.exp);
                        return response.status(482).json({ status: 482, errors: ['JWT invalid'] });
                    }

                    request.decoded = decoded;

                    next();
                }
            } catch (err) {
                console.error(err);
                response.status(400).json({ status: 400, errors: ['Something went wrong'] });
            }
        });
    } else {
        return response.status(480).json({
            status: 480,
            errors: ['Auth token is not supplied']
        });
    }
}


async function checkTokenSuperUser(request, response, next) {
    let token = request.headers['x-access-token'] || request.headers['authorization']; // Express headers are auto converted to lowercase
    if (token) {
        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        jwt.verify(token, JWT_KEY_SUPERUSER, async (err, decoded) => {
            try {
                if (err) {
                    return response.status(480).json({
                        status: 480,
                        errors: ['Token is not valid']
                    });
                } else {

                    //search if token is in blacklist
                    const blacklistTokens = await database.searchTokenInBlackList(token)
                        .catch(error => {
                            console.error(error);
                            return response.status(400).json({ status: 400, errors: ['Something went wrong'] });
                        });

                    //token is in blacklist
                    if (blacklistTokens[0]) {
                        return response.status(480).json({
                            status: 481,
                            errors: ['token is no longer valid']
                        });
                    }

                    request.decoded = decoded;

                    next();
                }
            } catch (err) {
                console.error(err);
                response.status(400).json({ status: 400, errors: ['Something went wrong'] });
            }
        });
    } else {
        return response.status(480).json({
            status: 480,
            errors: ['Auth token is not supplied']
        });
    }
}

module.exports = {
    checkToken: checkToken,
    checkTokenSuperUser: checkTokenSuperUser
}
