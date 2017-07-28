const migration = require('../../migrations/<%= migrationName %>');

describe('migrations <%= migrationName %>', () => {
  it('should migrate up', async () => {
    await migration.up();

    // FIXME write a test to ensure the up function works as expected
  });

  it('should migrate down', async () => {
    await migration.down();

    // FIXME write a test to ensure the down function works as expected
  });
});
