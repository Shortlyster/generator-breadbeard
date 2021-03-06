const uuid = require('uuid');
const timekeeper = require('timekeeper');
const model = require('../../src/utils/model');
const { thinky, schema } = require('../../config');

describe('utils/model', function () {
  this.timeout(5000);

  describe('.create(modelName)', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'thing',
      pluralName: 'things',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        email: {
          type: 'string',
          format: 'email'
        },
        password: {
          type: 'string'
        }
      },
      required: [
        'email',
        'password'
      ]
    };
    let Model;

    before(() => {
      schema.thing = TEST_JSON_SCHEMA;
      Model = model.create('thing');
    });

    it('should build a thinky class', () => {
      expect(Model).to.eql(thinky.models.things);
    });

    it('should pick up validation errors', async () => {
      try {
        await new Model({}).save();
        throw new Error('should fail validations');
      } catch (error) {
        expect(error).to.be.instanceOf(thinky.Errors.ValidationError);
        expect(error.message).to.eql('`email` is required, `password` is required');
      }
    });

    it('should pick up validation errors', async () => {
      const params = { email: 'blah!', password: 'blah!' };
      try {
        await new Model(params).save();
        throw new Error('should fail validations');
      } catch (error) {
        expect(error).to.be.instanceOf(thinky.Errors.ValidationError);
        expect(error.message).to.eql('`email` must match format "email"');
      }
    });
  });

  describe('update/replace data', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'updThing',
      pluralName: 'updThings',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        }
      },
      required: [
        'firstName'
      ]
    };

    let Model;
    let record;
    let hookCalls = [];

    before(() => {
      schema.updThing = TEST_JSON_SCHEMA;
      Model = model.create('updThing');

      Model.pre('save', next => {
        hookCalls.push('pre save 1');
        next();
      });

      Model.post('save', next => {
        hookCalls.push('post save 1');
        next();
      });

      Model.pre('validate', next => {
        hookCalls.push('pre validate 1');
        next();
      });
    });

    beforeEach(async () => {
      record = await new Model({ id: uuid.v4(), firstName: 'nikolay', lastName: 'theosom' }).save();
      hookCalls = [];
    });

    it('partially updates data with #udpate', async () => {
      await record.update({ lastName: 'new name' });

      expect(record.firstName).to.eql('nikolay');
      expect(record.lastName).to.eql('new name');

      const dbRecord = await Model.get(record.id).run();
      expect(dbRecord.lastName).to.eql(record.lastName);
    });

    it('fully updates data with #replace', async () => {
      await record.replace({ firstName: 'new name' });

      expect(record.firstName).to.eql('new name');
      expect(record).to.not.have.property('lastName');

      const dbRecord = await Model.get(record.id).run();
      expect(dbRecord.firstName).to.eql(record.firstName);
      expect(dbRecord).to.not.have.property('lastName');
    });

    it('explodes when validation fails', async () => {
      try {
        await record.update({ firstName: null });
        throw new Error('validation must fail');
      } catch (error) {
        expect(error.message).to.eql('`firstName` must be string');
      }
    });

    it('runs the pre/post hooks as expected', async () => {
      await record.update({ lastName: 'new name' });
      expect(hookCalls).to.eql(['pre validate 1', 'pre save 1', 'post save 1']);
    });
  });

  describe('a model with createdAt/updatedAt properties', () => {
    const TEST_JSON_SCHEMA = {
      type: 'object',
      name: 'timestampsThing',
      pluralName: 'timestampsThings',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        },
        name: {
          type: 'string'
        },
        createdAt: {
          type: 'string',
          format: 'date-time'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time'
        }
      },
      required: [
        'name'
      ]
    };
    let Model;
    let now;
    let record;

    before(() => {
      schema.timestampsThing = TEST_JSON_SCHEMA;
      Model = model.create('timestampsThing');
      now = new Date();
    });

    beforeEach(async () => {
      record = await new Model({ name: 'nikolay!' }).save();
    });

    afterEach(() => timekeeper.freeze(now));

    it('automatically populates the created at and updated at timestamps', () => {
      expect(record.createdAt).to.eql(new Date().toISOString());
      expect(record.updatedAt).to.eql(new Date().toISOString());
    });

    it('updates the updatedAt and keeps createdAt on existing records', async () => {
      const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);

      timekeeper.freeze(tomorrow);
      await record.merge({ name: 'antikolay' }).save();

      expect(record.createdAt).to.eql(now.toISOString());
      expect(record.updatedAt).to.eql(tomorrow.toISOString());
    });

    it('updates the updatedAt with custom #update/#replace methods as well', async () => {
      const tomorrow = new Date(); tomorrow.setDate(now.getDate() + 1);

      timekeeper.freeze(tomorrow);
      await record.update({ name: 'antikolay' });

      expect(record.createdAt).to.eql(now.toISOString());
      expect(record.updatedAt).to.eql(tomorrow.toISOString());
    });
  });
});
