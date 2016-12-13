const { app } = require('../helper');
const userFixture = require('../fixtures/user');
const users = require('../../src/controllers/users');
const { testStandardRoute } = require('../support/routes');

const serialize = user => {
  const clone = Object.assign({}, user);
  delete clone.password;
  return clone;
};

describe('/users route', () => {
  testStandardRoute(app, '/users', userFixture, serialize);

  describe('POST /signin', () => {
    let user;
    let validData;

    before(function *() {
      validData = userFixture.data();
      user = yield users.create(validData);
    });

    it('generates an auth token and returns a user', function *() {
      const response = yield app.post('/users/signin', {
        email: validData.email, password: validData.password
      });
      expect(response.status).to.eql(200);
      expect(response.body.user).to.eql(serialize(user));
      expect(response.body.token).to.be.a('string');
    });

    it('throws 401 when credentials are incorect', function *() {
      const response = yield app.post('/users/signin', {
        email: validData.email, password: 'hack hack hack'
      });

      expect(response.status).to.eql(401);
      expect(response.body).to.eql({ error: 'Unauthorized' });
    });
  });
});
