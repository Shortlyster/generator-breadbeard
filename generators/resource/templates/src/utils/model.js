const Ajv = require('ajv');
const { thinky, schema } = require('../../config');

/**
 * Creates a Thiky model based on a schema definition
 *
 * @param {String} model name (in JSON schema)
 * @return {Class} thinky model
 */
exports.create = (modelName) => {
  const modelSchema = schema[modelName];
  const validator = exports.thinkyValidatorFor(modelSchema);
  const Model = thinky.createModel(
    modelSchema.pluralName,
    { /* we are relying on the JSON schema validator to ensure data consitency */ },
    { validator, enforce_extra: 'none', enforce_type: 'none' }
  );

  if (modelSchema.properties.createdAt || modelSchema.properties.updatedAt) {
    exports.setTimestampsHandling(Model);
  }

  Model.standardQuery = exports.queryBuilder(Model, modelSchema);
  Model.standardFeed = exports.feedBuilder(Model);

  return Model;
};

/* eslint no-nested-ternary: off */
const humanReadableErrors = errors => errors.map(error => {
  const { dataPath, message, keyword, params: { missingProperty, additionalProperty } } = error;
  const path = keyword === 'required'
    ? `${dataPath}.${missingProperty}`
    : (additionalProperty || dataPath);

  const text = keyword === 'required'
    ? 'is required'
    : additionalProperty
      ? 'is not an allowed property'
      : message.replace('should', 'must');

  return `\`${path.replace(/^\./, '')}\` ${text}`;
});

/**
 * Builds a Thinky compatible data validator out of the JSON Schema
 *
 * @param {Object} model JSON schema
 * @return {Function} thinky compatible validator
 */
exports.thinkyValidatorFor = (schema) => {
  const ajv = new Ajv({ allErrors: true, v5: true });
  const validate = ajv.compile(schema);

  return document => {
    if (!validate(document)) {
      throw new thinky.Errors.ValidationError(
        humanReadableErrors(validate.errors).join(', ')
      );
    }
  };
};

/**
 * A standard query builder (used in controllers)
 *
 * @param {Class} thinky model
 * @param {Object} model json schema
 * @return {Function} a query builder
 */
exports.queryBuilder = (model, schema) => (params = {}) => {
  let query = model;
  const filter = {};

  Object.keys(params).forEach(key => {
    if (schema.properties[key]) {
      if (Array.isArray(params[key])) {
        if (params[key].length === 0) {
          query = query.filter(false);
        } else {
          const expr = thinky.r.expr(params[key]);
          query = query.filter(doc => expr.contains(doc(key)));
        }
      } else {
        filter[key] = params[key];
      }
    }
  });

  if (Object.keys(filter).length > 0) {
    query = query.filter(filter);
  }

  if (params.orderBy && schema.properties[params.orderBy]) {
    const direction = params.order || 'asc';
    query = query.orderBy(params.orderBy, direction);
  }

  if (params.skip && !isNaN(parseInt(params.skip, 10))) {
    query = query.skip(parseInt(params.skip, 10));
  }

  if (params.limit && !isNaN(parseInt(params.limit, 10))) {
    query = query.limit(parseInt(params.limit, 10));
  }

  return query;
};

/**
 * Creates a standard change feed for apps
 *
 * @param {Classs} model
 * @return {Function} feed builer
 */
exports.feedBuilder = (Model) => (params = {}) => {
  const changeParams = { includeInitial: true, includeStates: true };

  return Model.standardQuery(params).changes(changeParams).then(feed => Object.assign(feed, {
    listen(callback) {
      let allLoaded = false;

      feed.feed.each((err, doc) => {
        if (err) {
          callback(err);
        } else if (doc.state) {
          if (doc.state === 'ready') {
            callback(null, 'all:loaded', allLoaded = true);
          }
        } else if (doc.new_val && !doc.old_val) {
          callback(null, allLoaded ? 'created' : 'existed', new Model(doc.new_val));
        } else if (!doc.new_val && doc.old_val) {
          callback(null, 'deleted', new Model(doc.old_val));
        } else if (doc.new_val && doc.old_val) {
          callback(null, 'updated', new Model(doc.new_val));
        }
      });
    }
  }));
};

/**
 * Sets the automatic `createdAt` and `updatedAt` records handling
 *
 * @param {class} thinky model
 * @return void
 */
exports.setTimestampsHandling = Model => {
  Model.pre('save', function (next) {
    this.updatedAt = new Date().toISOString();

    if (!this.createdAt) {
      this.createdAt = this.updatedAt;
    }

    next();
  });
};

/**
 * The document #update/#replace functionality
 */
const Document = require('thinky/lib/document');

Object.defineProperty(Document.prototype, 'update', {
  enumerable: false,
  value(data) {
    return this.replace(Object.assign({ }, this, data));
  }
});

Object.defineProperty(Document.prototype, 'replace', {
  enumerable: false,
  value(data) {
    const applyHooks = hooks =>
      hooks.forEach(hook => hook.call(this, () => {}));

    // cleaing up all the existing data
    const protectedFields = ['id', 'createdAt', 'updatedAt'];
    Object.getOwnPropertyNames(this)
      .filter(key => !protectedFields.includes(key))
      .forEach(key => delete this[key]);

    // setting new data
    this.merge(Object.assign({ }, data));

    // NOTE: `validate()` can return a Promise
    return Promise.resolve(this.validate()).then(() => {
      const Model = this.getModel();
      const { _thinky: { r }, _pre: { save: preSave }, _post: { save: postSave } } = Model;

      applyHooks(preSave);

      const newData = Object.assign({ }, this);

      // making a low level `replace` request that validates the current `rev` on the DB side
      return r.table(Model.getTableName()).get(this.id).replace(doc => (newData)).run() // eslint-disable-line
      .then(result => { // eslint-disable-line
        applyHooks(postSave);

        return Object.assign(this, newData);
      });
    });
  }
});
