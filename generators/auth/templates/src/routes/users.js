const { createRouter } = require('../utils/router');
const users = require('../controllers/users');

const serialize = user => {
  const data = Object.assign({}, user);
  delete data.password;
  return data;
};

module.exports = createRouter(users, serialize)
  .post('/signin', async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await users.signin(email, password);
    res.json({ token, user: serialize(user) });
  })
  .post('/signout', async (req, res) => {
    res.json(await users.signout(req.body));
  });
