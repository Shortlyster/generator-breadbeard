require('dotenv-safe').load({ sample: './.env.example' });

const {
  PORT = 3001,
  RETHINKDB_URL,
  HASH_ROUNDS = 10,
  LOG_LEVEL = 'info',
  NODE_ENV = 'development',
  JWT_SECRET = 'Ba(0/\\/'
} = process.env;

module.exports = {
  PORT,
  NODE_ENV,
  RETHINKDB_URL,
  JWT_SECRET,
  LOG_LEVEL,
  HASH_ROUNDS: parseInt(HASH_ROUNDS, 10)
};
