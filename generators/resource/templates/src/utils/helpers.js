const { cloneDeep } = require('lodash');

exports.nullToUndefined = data => convert(cloneDeep(data));

exports.makeYieldable = value =>
  isYieldable(value) ? value : Promise.resolve(value);

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

/**
 * Checks if the item is a yieldable value
 *
 * @param {Object} something
 * @return {boolean} check result
 */
function isYieldable(something) {
  const procTypeName = ({}).toString.call(something.constructor);
  const isGenerator = procTypeName.includes('GeneratorFunction');
  const isPromise = something instanceof Promise;

  return isGenerator || isPromise;
}
