require('express-yields');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = require('express')();
const routes = require('./routes');
const { accessLog, httpErrors } = require('./middleware');

app.use(accessLog);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use(routes);

app.use(httpErrors);

module.exports = app;
