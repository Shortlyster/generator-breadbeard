/* eslint global-require: 'off', no-console: 'off' */

const _ = require('lodash');
const os = require('os');
const { thinky: { r } } = require('../../config');
const Migration = require('../models/migration');
const { slurp } = require('./module');

const MUTEX_MIGRATION_NAME = 'migrations_running_mutex';

const migrationFiles = slurp('migrations');
const existingMigrations = Object.keys(migrationFiles).sort().map((name) => {
  const { up, down } = migrationFiles[name];
  return { up, down, name: _.snakeCase(name) };
});

exports.list = async () => {
  await Migration.ready();
  const records = await Migration.run();

  return existingMigrations.map((migration) => {
    const { name, up, down } = migration;
    const [applied] = records.filter(r => r.name === name);
    return { up, down, name, applied: !!applied };
  });
};

exports.queryMutex = async () => {
  await Migration.ready();
  const [mutex] = await Migration.filter({ name: MUTEX_MIGRATION_NAME }).run();
  return mutex;
};

exports.acquireMutex = async () => {
  await Migration.ready();
  /* eslint no-underscore-dangle: 'off' */
  return await r.branch(
    Migration.filter({ name: MUTEX_MIGRATION_NAME }).count().gt(0)._query,
    r.error('mutex locked'),
    Migration.insert({
      hostname: os.hostname(),
      name: MUTEX_MIGRATION_NAME,
      date: new Date()
    })._query
  ).run();
};

exports.releaseMutex = async () => {
  const mutex = await exports.queryMutex();
  return mutex && await mutex.delete();
};

exports.up = async (name) => {
  await exports.acquireMutex();

  try {
    const migrations = await exports.list();
    const pendingMigrations = migrations.filter(m =>
      !m.applied && (name ? m.name === name : true)
    );

    if (pendingMigrations.length < 1) {
      console.log('No pending migrations found');
    }

    for (const migration of pendingMigrations) {
      console.log('Migrating', migration.name);
      await migration.up();
      await new Migration({ name: migration.name, date: new Date() }).save();
    }
  } finally {
    await exports.releaseMutex();
  }
};

exports.down = async (name) => {
  await exports.acquireMutex();

  try {
    const migrations = await exports.list();
    const [migration] = migrations.filter(m => m.name === name);

    if (!migration) throw new Error('Could not find the migration');
    if (!migration.applied) throw new Error('This migration was never applied');
    if (!migration.down) throw new Error('This migration does not have a `down` option');

    console.log('Rolling back', name);
    await migration.down();

    const [record] = await Migration.filter({ name }).run();
    if (record) await record.delete();
  } finally {
    await exports.releaseMutex();
  }
};
