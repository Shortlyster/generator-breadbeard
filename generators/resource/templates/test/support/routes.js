/**
 * A set of standard router testing scripts
 */
const { run, sorted, toObject, UUID_RE, jsonDecode } = require('./commons');

/**
 * runs all the steps with the given arguments
 *
 * @param {Object} app
 * @param {String} path namespace
 * @param {Object} fixture
 * @param {Function} serializer (optional)
 * @param {Object} options { skip: [...], only: [...] }
 * @return void
 */
exports.testStandardRoute = (...args) => {
  run(args, {
    index: exports.testStandardRouteIndex,
    fetch: exports.testStandardRouteFetch,
    post: exports.testStandardRoutePost,
    put: exports.testStandardRoutePut,
    patch: exports.testStandardRoutePatch,
    delete: exports.testStandardRouteDelete
  });
};

/**
 * Tests the standard router GET / behavior for the route
 */
exports.testStandardRouteIndex = (app, path, fixture, serialize = toObject) => {
  describe('GET /', () => {
    let doc1;
    let doc2;

    before(async () => {
      await fixture.Model.delete().execute();

      [doc1, doc2] = await Promise.all([
        fixture.record(),
        fixture.record()
      ]);
    });

    it('returns all records by default', async () => {
      const response = await app.get(path);
      expect(response.status).to.eql(200);
      expect(sorted(response.body)).to.eql(sorted([doc1, doc2]).map(serialize).map(jsonDecode));
    });

    it('allows to specify property filters', async () => {
      const response = await app.get(path, { id: doc1.id });
      expect(response.status).to.eql(200);
      expect(sorted(response.body)).to.eql(sorted([doc1]).map(serialize).map(jsonDecode));
    });

    it('allows to sort data by fields', async () => {
      const response = await app.get(path, { orderBy: 'id' });
      expect(response.status).to.eql(200);
      expect(sorted(response.body, 'id')).to.eql(
        sorted([doc1, doc2], 'id').map(serialize).map(jsonDecode)
      );
    });

    it('allows `limit` data', async () => {
      const response = await app.get(path, { limit: 1, orderBy: 'id' });
      expect(response.status).to.eql(200);
      expect(response.body).to.eql(sorted(
        [doc1, doc2], 'id'
      ).slice(0, 1).map(serialize).map(jsonDecode));
    });
  });
};

/**
 * Tests the standard GET `/:id` route
 */
exports.testStandardRouteFetch = (app, path, fixture, serialize = toObject) => {
  describe('GET /:id', () => {
    let record;

    before(async () => {
      record = await fixture.record();
    });

    it('returns the record if exists', async () => {
      const response = await app.get(`${path}/${record.id}`);
      expect(response.status).to.eql(200);
      expect(response.body).to.eql(jsonDecode(serialize(record)));
    });

    it('throws 404 when the record does not exist', async () => {
      const response = await app.get(`${path}/hack-hack-hack`);
      expect(response.status).to.eql(404);
      expect(response.body).to.eql({ error: 'not found' });
    });
  });
};

/**
 * Tests the standard POST / route behavior
 */
exports.testStandardRoutePost = (app, path, fixture, serialize = toObject) => {
  describe('POST /', () => {
    it('creates new record when data is good', async () => {
      const omits = { id: undefined };
      const data = fixture.data(Object.assign({}, omits, { createdAt: undefined }));
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : {};

      const response = await app.post(path, data);

      expect(response.status).to.eql(201);
      expect(toObject(response.body, omits)).to.eql(
        jsonDecode(serialize(Object.assign({}, data, omits, timestamps)))
      );
      // must set the new id
      expect(response.body.id).to.match(UUID_RE);
    });

    it('throws 422 if the data is bad', async () => {
      const response = await app.post(path, {});
      expect(response.status).to.eql(422);
      expect(response.body.error).to.contain('is required');
    });
  });
};

/**
 * Tests the standard PUT /:id route functionality
 */
exports.testStandardRoutePut = (app, path, fixture, serialize = toObject) => {
  describe('PUT /:id', () => {
    let data;
    let record;

    beforeEach(async () => {
      record = await fixture.record({ createdAt: undefined });
      data = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('replaces an entire document and returns the updated record back', async () => {
      const response = await app.put(`${path}/${record.id}`, data);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : {};

      expect(response.status).to.eql(200);
      expect(response.body).to.eql(jsonDecode(serialize(
        Object.assign({id: record.id}, data, timestamps)
      )));
    });

    it('throws 404 if the record does not exist', async () => {
      const response = await app.put(`${path}/hack-hack-hack`, {});
      expect(response.status).to.eql(404);
      expect(response.body).to.eql({ error: 'not found' });
    });

    it('throws 422 if data is missing', async () => {
      const response = await app.put(`${path}/${record.id}`, { id: data.id });
      expect(response.status).to.eql(422);
      expect(response.body.error).to.contain('is required');
    });

    it('throws 422 if the data validation fails', async () => {
      const data = fixture.data({ id: 'hack hack hack' });
      const response = await app.put(`${path}/${record.id}`, data);
      expect(response.status).to.eql(422);
      expect(response.body).to.eql({
        error: `\`id\` must match pattern "${UUID_RE.toString().replace(/\//g, '')}"`
      });
    });
  });
};

/**
 * Tests the standard PATCH /:id route functionality
 */
exports.testStandardRoutePatch = (app, path, fixture, serialize = toObject) => {
  describe('PATCH /:id', () => {
    let data;
    let record;

    beforeEach(async () => {
      record = await fixture.record({ createdAt: undefined });
      data = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('replaces an entire document and returns the updated record back', async () => {
      const response = await app.patch(`${path}/${record.id}`, data);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : {};
      expect(response.status).to.eql(200);
      expect(response.body).to.eql(jsonDecode(serialize(
        Object.assign({}, record, data, timestamps)
      )));
    });

    it('accepts empty and partial data sets', async () => {
      const response = await app.patch(`${path}/${record.id}`, { id: data.id });
      expect(response.status).to.eql(200);
    });

    it('throws 404 if the record does not exist', async () => {
      const response = await app.patch(`${path}/hack-hack-hack`, {});
      expect(response.status).to.eql(404);
      expect(response.body).to.eql({ error: 'not found' });
    });

    it('throws 422 if the data validation fails', async () => {
      const data = fixture.data({ id: 'hack hack hack' });
      const response = await app.patch(`${path}/${record.id}`, data);
      expect(response.status).to.eql(422);
      expect(response.body).to.eql({
        error: `\`id\` must match pattern "${UUID_RE.toString().replace(/\//g, '')}"`
      });
    });

    // https://tools.ietf.org/html/rfc7396
    it('interprets `null` as delete', async () => {
      const record = await fixture.record({ foo: { bar: 'baz' }, boo: 'hoo' });
      const data = { id: record.id, foo: { bar: null }, boo: null };

      const response = await app.patch(`${path}/${record.id}`, data);

      expect(response.status).to.eql(200);
      expect(response.body.foo).to.eql({});
      expect(response.body).to.not.have.property('boo');
    });
  });
};

/**
 * Tests the standard DELETE /:id route functionality
 */
exports.testStandardRouteDelete = (app, path, fixture, serialize = toObject) => {
  describe('DELETE /:id', () => {
    let record;

    before(async () => {
      record = await fixture.record();
    });

    it('deletes a record if it exists', async () => {
      const response = await app.delete(`${path}/${record.id}`);
      expect(response.status).to.eql(200);
      expect(response.body).to.eql(jsonDecode(serialize(record)));
    });

    it('throws 404 if the record does not exist', async () => {
      const response = await app.delete(`${path}/hack-hack-hack`);
      expect(response.status).to.eql(404);
      expect(response.body).to.eql({ error: 'not found' });
    });
  });
};
