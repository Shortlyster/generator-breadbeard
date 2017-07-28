const { Router } = require('express');
const { nullToUndefined } = require('./helpers');

const defaultSerializer = record => Object.assign({}, record);

exports.createRouter = (controller, serialize = defaultSerializer) => {
  const router = new Router()
    .get('', async (req, res) => {
      const list = await controller.all(req.query);
      res.json(list.map(serialize));
    })
    .get('/:id', async (req, res) => {
      const record = await controller.find(req.params.id);
      res.json(serialize(record));
    })
    .post('', async (req, res) => {
      const record = await controller.create(req.body);
      res.status(201).json(serialize(record));
    })
    .put('/:id', async (req, res) => {
      const record = await controller.replace(req.params.id, req.body);
      res.json(serialize(record));
    })
    .patch('/:id', async (req, res) => {
      const replaced = nullToUndefined(req.body);
      const record = await controller.update(req.params.id, replaced);
      res.json(serialize(record));
    })
    .delete('/:id', async (req, res) => {
      const record = await controller.delete(req.params.id);
      res.json(serialize(record));
    });

  return router;
};
