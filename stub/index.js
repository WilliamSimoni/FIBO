//setting environment variables with dotenv
require('dotenv').config({ path: __dirname + '/./../.env' });

const PORT = process.env.STUB_PORT || 7777;

//FIBO routes
const { login } = require('./routers/login');
const { logout } = require('./routers/logout');
const { get } = require('./routers/get');
const { configurator } = require('./routers/configurator');

//Authorization middleware
const auth = require('./middleware/auth');

const compression = require('compression');
const express = require('express');

const app = express();
app.use(compression());

try {
    app.listen(PORT, () => { console.log(`listening on ${PORT}`) });
} catch (err) {
    return;
}

//functions to handle errors
const errors = require('./middleware/errors');

//add middleware which handle CORS problems
app.use(require('./middleware/cors').cors);

//add middleware helmet
const helmet = require('helmet');
app.use(helmet());

//add middleware which parse in json the body of the post request.
//limit means that the maximum body dimension in a post request is 1 megabyte

app.use('/get', express.json({ limit: '1mb' }));
app.use('/get', auth.checkToken);
app.use('/get', get);

app.use('/login', express.json({ limit: '1mb' }));
app.use('/login', login);

app.use('/logout', logout);

app.use('/config', express.json({ limit: '1mb' }));
app.use('/config', auth.checkTokenSuperUser);
app.use('/config', configurator);

app.use(express.static('public'));

//middleware to handling error
app.use(errors.errorJSONParser);
app.use(errors.sanitizerErr);
app.use(errors.genericError);
