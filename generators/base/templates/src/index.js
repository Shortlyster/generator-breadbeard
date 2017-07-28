require('express-yields');
const bodyParser = require('body-parser');
const app = require('express')();
const routes = require('./routes');
const logger = require('morgan');
const { httpErrors } = require('./middleware');
const { NODE_ENV } = require('../config');
if (process.env.RUNTIME_ANALYTICS) require('newrelic'); // eslint-disable-line

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

if (NODE_ENV !== 'test') app.use(logger('tiny'));

app.use(routes);

app.use(httpErrors);

module.exports = app;
