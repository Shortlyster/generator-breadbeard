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

    before(function *() {
      yield fixture.Model.delete().execute();

      [doc1, doc2] = yield [
        fixture.record(),
        fixture.record()
      ];
    });

    it('returns all records by default', function *() {
      const response = yield app.get(path);
      response.status.must.eql(200);
      sorted(response.body).must.eql(sorted([doc1, doc2]).map(serialize).map(jsonDecode));
    });

    it('allows to specify property filters', function *() {
      const response = yield app.get(path, { id: doc1.id });
      response.status.must.eql(200);
      sorted(response.body).must.eql(sorted([doc1]).map(serialize).map(jsonDecode));
    });

    it('allows to sort data by fields', function *() {
      const response = yield app.get(path, { orderBy: 'id' });
      response.status.must.eql(200);
      sorted(response.body, 'id').must.eql(
        sorted([doc1, doc2], 'id').map(serialize).map(jsonDecode)
      );
    });

    it('allows `limit` data', function *() {
      const response = yield app.get(path, { limit: 1, orderBy: 'id' });
      response.status.must.eql(200);
      response.body.must.eql(sorted(
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

    before(function *() {
      record = yield fixture.record();
    });

    it('returns the record if exists', function *() {
      const response = yield app.get(`${path}/${record.id}`);
      response.status.must.eql(200);
      response.body.must.eql(jsonDecode(serialize(record)));
    });

    it('throws 404 when the record does not exist', function *() {
      const response = yield app.get(`${path}/hack-hack-hack`);
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });
  });
};

/**
 * Tests the standard POST / route behavior
 */
exports.testStandardRoutePost = (app, path, fixture, serialize = toObject) => {
  describe('POST /', () => {
    it('creates new record when data is good', function *() {
      const omits = { id: undefined };
      const data = fixture.data(Object.assign({}, omits, { createdAt: undefined }));
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date(), updatedAt: new Date()
      } : {};

      const response = yield app.post(path, data);

      response.status.must.eql(201);
      toObject(response.body, omits).must.eql(
        jsonDecode(serialize(Object.assign({}, data, omits, timestamps)))
      );

      // must set the new id
      response.body.id.must.match(UUID_RE);
    });

    it('throws 422 if the data is bad', function *() {
      const response = yield app.post(path, {});
      response.status.must.eql(422);
      response.body.error.must.contain('is required');
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

    beforeEach(function *() {
      record = yield fixture.record({ createdAt: undefined });
      data = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('replaces an entire document and returns the updated record back', function *() {
      const response = yield app.put(`${path}/${record.id}`, data);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date(), updatedAt: new Date()
      } : {};

      response.status.must.eql(200);
      response.body.must.eql(jsonDecode(serialize(
        Object.assign({}, record, data, timestamps)
      )));
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.put(`${path}/hack-hack-hack`, {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });

    it('throws 422 if data is missing', function *() {
      const response = yield app.put(`${path}/${record.id}`, { id: data.id });
      response.status.must.eql(422);
      response.body.error.must.contain('is required');
    });

    it('throws 422 if the data validation fails', function *() {
      const data = fixture.data({ id: 'hack hack hack' });
      const response = yield app.put(`${path}/${record.id}`, data);
      response.status.must.eql(422);
      response.body.must.eql({
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

    beforeEach(function *() {
      record = yield fixture.record({ createdAt: undefined });
      data = fixture.data({ id: undefined, createdAt: undefined });
    });

    it('replaces an entire document and returns the updated record back', function *() {
      const response = yield app.patch(`${path}/${record.id}`, data);
      const timestamps = fixture.schema.properties.createdAt ? {
        createdAt: new Date(), updatedAt: new Date()
      } : {};
      response.status.must.eql(200);
      response.body.must.eql(jsonDecode(serialize(
        Object.assign({}, record, data, timestamps)
      )));
    });

    it('accepts empty and partial data sets', function *() {
      const response = yield app.patch(`${path}/${record.id}`, { id: data.id });
      response.status.must.eql(200);
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.patch(`${path}/hack-hack-hack`, {});
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });

    it('throws 422 if the data validation fails', function *() {
      const data = fixture.data({ id: 'hack hack hack' });
      const response = yield app.patch(`${path}/${record.id}`, data);
      response.status.must.eql(422);
      response.body.must.eql({
        error: `\`id\` must match pattern "${UUID_RE.toString().replace(/\//g, '')}"`
      });
    });

    // https://tools.ietf.org/html/rfc7396
    it('interprets `null` as delete', function *() {
      const record = yield fixture.record({ foo: { bar: 'baz' }, boo: 'hoo' });
      const data = { id: record.id, foo: { bar: null }, boo: null };

      const response = yield app.patch(`${path}/${record.id}`, data);

      response.status.must.eql(200);
      response.body.foo.must.eql({});
      response.body.must.not.have.property('boo');
    });
  });
};

/**
 * Tests the standard DELETE /:id route functionality
 */
exports.testStandardRouteDelete = (app, path, fixture, serialize = toObject) => {
  describe('DELETE /:id', () => {
    let record;

    before(function *() {
      record = yield fixture.record();
    });

    it('deletes a record if it exists', function *() {
      const response = yield app.delete(`${path}/${record.id}`);
      response.status.must.eql(200);
      response.body.must.eql(jsonDecode(serialize(record)));
    });

    it('throws 404 if the record does not exist', function *() {
      const response = yield app.delete(`${path}/hack-hack-hack`);
      response.status.must.eql(404);
      response.body.must.eql({ error: 'not found' });
    });
  });
};
