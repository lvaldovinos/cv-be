'use strict';

const { Tool, behaviorFactory } = require('cv-core');
const restify = require('restify');
const util = require('../util');

const getToolBehavior = util.getBehavior(behaviorFactory.types.TOOL);

const toolSchema = {
  id: '/tool',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      format: 'alphanumeric',
    },
    webpage: {
      type: 'string',
      format: 'url',
    },
  },
  required: [
    'name',
  ],
};

const validateToolPayload = util.bodyValidator({
  type: 'tool',
  schema: toolSchema,
});

function createTool(req, res, next) {
  const { validatedBody: body, behavior } = req;
  const newBody = Object.assign({}, body, {
    behavior,
  });
  Tool.create(newBody)
    .then((tool) => {
      req.responseData = {
        code: 201,
        data: {
          id: tool.id,
        },
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getToolById(req, res, next) {
  const { behavior } = req;
  const { toolId } = req.params;
  const toolReader = new Tool.Reader(behavior);
  toolReader.getById(toolId)
    .then((tool) => {
      if (tool === null) {
        return res.send(404, 'Tool resource not found');
      }
      req.tool = tool;
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeTool(req, res, next) {
  const { tool } = req;
  tool.remove()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getAllTools(req, res, next) {
  const { behavior } = req;
  const toolReader = new Tool.Reader(behavior);
  toolReader
    .getAll()
    .then((tools) => {
      req.responseData = {
        code: 200,
        data: tools,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function updateTool(req, res, next) {
  const { tool, validatedBody: body } = req;
  Object.assign(tool, body);
  tool.update()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function router(server) {
  server.post('/tools', validateToolPayload, getToolBehavior, createTool, util.sendResponse);
  server.get('/tools', getToolBehavior, getAllTools, util.sendResponse);
  server.del('/tools/:toolId', getToolBehavior, getToolById, removeTool, util.sendResponse);
  server.put('/tools/:toolId', validateToolPayload, getToolBehavior, getToolById, updateTool, util.sendResponse);
}

module.exports = router;
