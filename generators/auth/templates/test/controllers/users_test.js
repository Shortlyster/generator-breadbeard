const { Unauthorized } = require('httperrors');
const users = require('../../src/controllers/users');
const { testStandardController } = require('../support/controllers');
const userFixture = require('../fixtures/user');

describe('users controller', () => {
  testStandardController(users, userFixture, record =>
    // don't compare passwords as they're encrypted and overwritten
    Object.assign(record, { password: '[FILTERED]' })
  );

  describe('.signin(email, password)', () => {
    let user;
    let validData;

    beforeEach(function *() {
      validData = userFixture.data();
      user = yield users.create(validData);
    });

    it('returns a user and token if everything is correct', function *() {
      const result = yield users.signin(validData.email, validData.password);
      expect(result.token).to.be.a('string');

      expect(Object.assign({}, result.user)).to.eql(Object.assign({}, user));
    });

    it('throws UNAUTHORIZED if the email is wrong', function *() {
      try {
        yield users.signin('h4ckr@h4ck.com', validData.password);
      } catch (e) {
        expect(e).to.be.instanceOf(Unauthorized);
      }
    });

    it('throws UNAUTHORIZED if the password is wrong', function *() {
      try {
        yield users.signin(validData.email, 'hack hack hack');
      } catch (e) {
        expect(e).to.be.instanceOf(Unauthorized);
      }
    });
  });
});
