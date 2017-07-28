const chai = require('chai');

global.expect = chai.expect;

const app = require('../src/index');
const doubleagent = require('doubleagent');

exports.app = doubleagent(app);

const models = require('../src/models');

process.nextTick(() => {
  before(async function() {
    this.timeout(30000);

    // waiting on all tables to pop up
    await Promise.all(Object.keys(models).map(
      name => models[name].ready()
    ));
  });
});

const timekeeper = require('timekeeper');

process.nextTick(() => {
  before(() => timekeeper.freeze(new Date()));
  after(() => timekeeper.reset());
});
