/**
 * Creates a controller with extra methods
 *
 * @param {Class} model
 * @param {Object} extra methods
 * @return {Object} controller
 */
exports.createController = (Model, subController) => {
  const baseController = exports.baseController(Model);
  Object.setPrototypeOf(subController, baseController);
  return subController;
};

/**
 * basic CRUD controller generator
 *
 * @param {Class} model
 * @return {Object} base controller generator
 */
exports.baseController = Model => ({
  async all(params) {
    return await Model.standardQuery(params).run();
  },

  async watch(params) {
    const [feed, count] = await Promise.all([
      Model.standardFeed(params),
      Model.standardQuery(params).count().execute()
    ]);
    return { feed, count };
  },

  async find(id) {
    return await Model.get(id);
  },

  async create(params) {
    return await new Model(Object.assign({}, params)).save();
  },

  async update(id, params) {
    const record = await this.find(id);
    return await record.update(Object.assign({}, params));
  },

  async replace(id, params) {
    const record = await this.find(id);
    return await record.replace(Object.assign({}, params));
  },

  async delete(id) {
    const record = await this.find(id);
    await record.delete();
    return record;
  }
});
