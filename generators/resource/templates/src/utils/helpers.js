const { cloneDeep } = require('lodash');

/**
 * Converts all `null` values in the object to `undefined`
 * so that thinky models would delete the data on records update
 *
 * https://tools.ietf.org/html/rfc7396
 *
 * @param {Object} original data
 * @return {Object} patched data
 */
function convert(value) {
  switch (({}).toString.call(value)) {
    case '[object Object]':
      return convertObject(value);
    case '[object Array]':
      return value.map(convert);
    case '[object Null]':
      return undefined;
    default:
      return value;
  }
}

function convertObject(value) {
  return Object.keys(value).reduce((clone, key) =>
    Object.assign(clone, { [key]: convert(value[key]) })
  , {});
}

exports.nullToUndefined = data => convert(cloneDeep(data));
