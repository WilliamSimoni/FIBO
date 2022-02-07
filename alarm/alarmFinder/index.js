require('dotenv').config({ path: __dirname + './../../.env' });

const express = require('express');
const app = express();

const PORT = process.env.ALARM_FINDER_PORT || 47777;

const { alarm } = require('./routers/alarm');

app.use(express.json());

try {
  app.listen(PORT, () => { console.log(`listening on ${PORT}`) });
} catch (err) {
  return;
}

app.use('/alarm', alarm);

function errorJSONParser(err, request, response, next) {
  if (err instanceof SyntaxError && err.status === 400) {
    response.status(400).json({ status: 400, errors: ['body must be in json'] });
    return;
  }
  next(err);
}

function genericError(err, request, response, next) {
  console.error(err.stack);
  response.status(400).json({ status: 400, errors: ['Something went wrong'] });
  return;
}

//middleware to handling error
app.use(errorJSONParser);
app.use(genericError);
