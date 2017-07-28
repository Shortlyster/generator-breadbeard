/**
 * This module has the standard CRUD controller functionality tests
 *
 * USEAGE:
 * describe("my awesome controller", () => {
 *   testStandardController(controller, fixture);
 * });
 */
const { thinky: { Errors: { DocumentNotFound, ValidationError } } } = require('../../config');
const { run, sorted, toObject, UUID_RE } = require('./commons');

const sameThing = record => record; // so one could override it in custom cases

/**
 * an all in one test fro the entire RESTful API
 *
 * @param {Object} controller
 * @param {Object} fixture
 * @param {Function} filter optional filter to transform data before comparisons
 * @param {Object} options
 * @return void
 */
exports.testStandardController = (...args) => {
  run(args, {
    list: exports.testStandardControllerList,
    find: exports.testStandardControllerFind,
    create: exports.testStandardControllerCreate,
    update: exports.testStandardControllerUpdate,
    replace: exports.testStandardControllerReplace,
    delete: exports.testStandardControllerDelete
  });
};

/**
 * Tests the standard `controller#all(query)` functionality
 */
exports.testStandardControllerList = (controller, fixture) => {
  describe('.all(query)', () => {
    let doc1;
    let doc2;
    let doc3;

    before(async () => {
      await fixture.Model.delete().execute();

      [doc1, doc2, doc3] = await Promise.all([
        fixture.record(),
        fixture.record(),
        fixture.record()
      ]);
    });

    it('returns all the records by default', async () => {
      const result = await controller.all();
      expect(result).to.be.an('array');
      expect(sorted(result)).to.eql(sorted([
        doc1, doc2, doc3
      ]));
    });

    it('allows to filter the list by a specific field', async () => {
      const filter = { id: doc1.id };
      const result = await controller.all(filter);
      expect(sorted(result)).to.eql(sorted([doc1]));
    });

    it('ignores totally unsupported params', async () => {
      const filter = { totalMonkey: 123 };
      const result = await controller.all(filter);
      expect(sorted(result)).to.eql(sorted([
        doc1, doc2, doc3
      ]));
    });

    it('allows to order things by a specific field', async () => {
      const params = { orderBy: 'id' };
      const result = await controller.all(params);
      expect(result.map(toObject)).to.eql(sorted([doc1, doc2, doc3], 'id'));
    });

    it('allows to skip records', async () => {
      const params = { orderBy: 'id', skip: 1 };
      const result = await controller.all(params);
      expect(result.map(toObject)).to.eql(sorted([doc1, doc2, doc3], 'id').slice(1));
    });

    it('allows to limit records', async () => {
      const params = { orderBy: 'id', limit: 2 };
      const result = await controller.all(params);
      expect(result.map(toObject)).to.eql(sorted([doc1, doc2, doc3], 'id').slice(0, 2));
    });
  });
};

/**
 * Tests the individual `controller#find(id)` method
 */
exports.testStandardControllerFind = (controller, fixture) => {
  describe('.find(id)', () => {
    let record;

    before(async () => {
      record = await fixture.record();
    });

    it('returns the record when it exists', async () => {
      const result = await controller.find(record.id);
      expect(toObject(result)).to.eql(toObject(record));
    });

    it('throws DocumentNotFound if the record does not exist', async () => {
      try {
        await controller.find('hack!');
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        expect(error).to.be.instanceOf(DocumentNotFound);
      }
    });
  });
};

/**
 * The standard `controller.create(params)` method tests
 */
exports.testStandardControllerCreate = (controller, fixture, filter = sameThing) => {
  describe('.create(data)', () => {
    let validData;
    beforeEach(() => {
      validData = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('saves valid data and returns a model instance', async () => {
      const record = await controller.create(validData);

      expect(record.constructor).to.eql(fixture.Model);
      expect(record.id).to.match(UUID_RE);

      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : {};

      expect(toObject(filter(record))).to.eql(toObject(
        filter(validData), Object.assign(timestamps, { id: record.id })
      ));
    });

    it('throws validation errors when data is missing', async () => {
      try {
        await controller.create({});
        throw new Error('expected throw a ValidationError');
      } catch (e) {
        expect(e).to.be.instanceOf(ValidationError);
        expect(e.message).to.contain('is required');
      }
    });
  });
};

/**
 * Tests the standard `controller.update(id, params)` method
 */
exports.testStandardControllerUpdate = (controller, fixture = sameThing) => {
  describe('.update(id, params)', () => {
    let record;
    let validData;

    before(async () => {
      record = await fixture.record({ createdAt: undefined });
      validData = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('updates params when things are good', async () => {
      const result = await controller.update(record.id, validData);

      // must return an updated record
      expect(result.constructor).to.eql(fixture.Model);
    });

    it('throws validation errors when data is missing', async () => {
      try {
        await controller.replace(record.id, {});
        throw new Error('expected throw a ValidationError');
      } catch (e) {
        expect(e).to.be.instanceOf(ValidationError);
        expect(e.message).to.contain('is required');
      }
    });

    it('explodes when data is wrong', async () => {
      try {
        await controller.update(record.id, { id: 'hack!' });
        throw new Error('expected to throw a ValidationError');
      } catch (e) {
        expect(e).to.be.instanceOf(ValidationError);
        expect(e.message).to.contain('`id` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      try {
        await controller.update('hack!', validData);
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        expect(error).to.be.instanceOf(DocumentNotFound);
      }
    });
  });
};

/**
 * Tests the standard `controller.replace(id, data)` functionality
 */
exports.testStandardControllerReplace = (controller, fixture) => {
  describe('.replace(id, params)', () => {
    let record;
    let validData;

    before(async () => {
      record = await fixture.record({ createdAt: undefined });
      validData = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('updates params when things are good', async () => {
      const result = await controller.replace(record.id, validData);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: record.createdAt, updatedAt: new Date().toISOString()
      } : {};

      // must return an updated record
      expect(result.constructor).to.eql(fixture.Model);
      if (result.password) {
        result.password = 'flingle';
        validData.password = 'flingle';
      }

      expect(toObject(result)).to.eql(
        Object.assign({id: record.id}, validData, timestamps)
      );
    });

    it('explodes when data is wrong', async () => {
      const data = Object.assign({}, validData, { id: 'hack!' });

      try {
        await controller.replace(record.id, data);
        throw new Error('expected to throw a ValidationError');
      } catch (e) {
        expect(e).to.be.instanceOf(ValidationError);
        expect(e.message).to.contain('`id` must match pattern');
      }
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      try {
        await controller.replace('hack!', validData);
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        expect(error).to.be.instanceOf(DocumentNotFound);
      }
    });
  });
};

/**
 * Tests the standard `controller#delete(id)` functionality
 */
exports.testStandardControllerDelete = (controller, fixture, filter = sameThing) => {
  describe('.delete(id)', () => {
    let record;

    before(async () => {
      record = await fixture.record();
    });

    it('deletes a document for sure when it exists', async () => {
      const result = await controller.delete(record.id);
      expect(toObject(filter(result))).to.eql(toObject(filter(record)));

      const records = await record.getModel().filter({ id: record.id }).run();
      expect(records).to.have.length(0);
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      try {
        await controller.delete('hack!');
        throw new Error('expected throw DocumentNotFound');
      } catch (error) {
        expect(error).to.be.instanceOf(DocumentNotFound);
      }
    });
  });
};
