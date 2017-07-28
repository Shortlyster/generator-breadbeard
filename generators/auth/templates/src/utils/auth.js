const jwt = require('jsonwebtoken');
const password = require('shortlyster-password');
const { HASH_ROUNDS, JWT_SECRET } = require('../../config');

exports.createToken = function (data, expires) {
  return jwt.sign(data, JWT_SECRET, expires);
};

exports.verifyToken = function (token, opts = {}) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, opts, (err, decoded) => {
      if (err) return reject(err);
      return resolve(decoded);
    });
  });
};

exports.hashPassword = async (params) => {
  return Object.assign({}, params, params.password ? {
    password: await password.create(params.password, HASH_ROUNDS)
  } : {});
};

exports.verifyPassword = async (one, another) => {
  return await password.verify(one, another);
};
