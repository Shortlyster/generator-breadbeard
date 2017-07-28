const jwt = require('jsonwebtoken');
const { app } = require('../helper');
const { JWT_SECRET } = require('../../config');

const token = jwt.sign({ hello: 'world' }, JWT_SECRET);
const url = `/jwt/verify`;

describe('JWT authentication handling', () => {
  it('must accept a valid bearer token in a header', async () => {
    const response = await app.get(url, {}, {
      Authorization: `Bearer ${token}`
    });

    expect(response.status).to.eql(200);
  });

  it('must throw 401 for an invalid JWT bearer', async () => {
    const response = await app.get(url, {}, {
      Authorization: 'Bearer hackhackhack'
    });

    expect(response.status).to.eql(401);
  });

  it('must accept a valid JWT in a query string param', async () => {
    const response = await app.get(url, { token });
    expect(response.status).to.eql(200);
  });

  it('must reject invalid JWT in the query string params', async () => {
    const response = await app.get(url, { token: 'hack' });
    expect(response.status).to.eql(401);
  });
});
