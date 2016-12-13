const { schema } = require('../../config');
const { app } = require('../helper');

describe('/schema route', () => {
  it('must GET the schema data', function *() {
    const response = yield app.get('/schema');
    expect(response.status).to.eql(200);
    expect(response.body).to.eql(schema);
  });
});
