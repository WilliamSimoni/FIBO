require('dotenv').config({path:__dirname+'/./../.env'});

const express = require('express');
const app = express();

const PORT = process.env.CALCULATOR_PORT || 7778;

const {aggregator} = require('./routers/aggregation');

const compression = require('compression');

app.use(express.json());
app.use(compression());

app.use('/aggregate', aggregator);

try{
    app.listen(PORT, () => { console.log(`listening on ${PORT}`) });
}catch(err){
    return;
}

//middleware to handling error

const errors = require('./middleware/errors');

app.use(errors.errorJSONParser);
app.use(errors.genericError);
