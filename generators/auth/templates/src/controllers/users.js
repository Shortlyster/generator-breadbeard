const { User } = require('../models');
const { createController } = require('../utils/controller');
const { Unauthorized } = require('httperrors');
const { createToken, hashPassword, verifyPassword } = require('../utils/auth');

module.exports = createController(User, {
  *create(params) {
    return await super.create(await hashPassword(params));
  },

  *update(id, params) {
    return await super.update(id, await hashPassword(params));
  },

  *replace(id, params) {
    return await super.replace(id, await hashPassword(params));
  },

  *signin(email, pass) {
    const [user] = await User.filter({ email }).run();
    if (!user) throw new Unauthorized();

    const verified = await verifyPassword(pass, user.password);
    if (!verified) throw new Unauthorized();

    const token = createToken({ id: user.id, role: user.role });

    return { token, user };
  },

  signout() {
    return { ok: true };
  }
});
