/**
 * Reusable JSON API service client generator
 */
const qs = require('qs');
const axios = require('axios');
const HttpError = require('httperrors');
const { makeYieldable } = require('./helpers');

module.exports = (url, defaults = {}) => {
  const client = axios.create({
    baseURL: url,
    paramsSerializer: params => qs.stringify(params)
  });

  Object.keys(defaults).forEach(key => {
    client.defaults[key] = defaults[key];
  });

  // rewraps axios to throw HttpError instances instead
  const rewrapError = error => {
    const { response } = error;

    if (response) {
      // rewrapping the error into HttpError
      const { status, data } = response;
      throw new HttpError(status, data.error);
    } else {
      throw error;
    }
  };

  const call = (method, ...args) =>
    client[method](...args)
    .then(response => response.data)
    .catch(error => rewrapError(error));

  return {
    get: (path, params, options) => call('get', path, Object.assign({ params }, options)),
    put: (...args) => call('put', ...args),
    post: (...args) => call('post', ...args),
    patch: (...args) => call('patch', ...args),

    /**
     * Automatically goes through every available page of the resource
     * and feeds back the chunks of data
     *
     * @param {String} path
     * @param {Object} query params
     * @param {Function} yeildable page data handler
     * @return void
     */
    *eachPage(...args) {
      const handler = typeof args[args.length - 1] === 'function' ? args.pop() : () => Promise.resolve(null);
      const [path, params] = args;

      let page = 1;
      let hasMorePages = true;

      do {
        let result;

        try {
          const query = Object.assign({ page }, params);
          result = yield client.get(path, { params: query });
        } catch (error) {
          rewrapError(error);
        }

        yield makeYieldable(handler(result.data));
        hasMorePages = hasNextPageLink(result.headers);
        page++;
      } while (hasMorePages);
    }
  };
};

/**
 * Checks if the response headers has a link to the next page
 * of the data
 *
 * @param {Object} headers
 * @return {boolean} check result
 */
function hasNextPageLink(headers = {}) {
  const linkKey = Object.keys(headers).find(k => k.toLowerCase() === 'link');
  const linkValue = linkKey && headers[linkKey];
  return linkValue && linkValue.match(/<(.+?)>;\s*rel="next"/);
}
