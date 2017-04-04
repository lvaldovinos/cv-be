'use strict';

const { Role, behaviorFactory } = require('cv-core');
const restify = require('restify');
const util = require('../util');

const getRoleBehavior = util.getBehavior(behaviorFactory.types.ROLE);

const roleSchema = {
  id: '/role',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      format: 'onlyCharactersAndSpace',
    },
    color: {
      type: 'string',
      format: 'hexColor',
    },
  },
  required: [
    'name',
    'color',
  ],
};

const validateRolePayload = util.bodyValidator({
  type: 'role',
  schema: roleSchema,
});

function createRole(req, res, next) {
  const { validatedBody: body, behavior } = req;
  const newBody = Object.assign({}, body, {
    behavior,
  });
  Role.create(newBody)
    .then((role) => {
      req.responseData = {
        code: 201,
        data: {
          id: role.id,
        },
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getRoleById(req, res, next) {
  const { behavior } = req;
  const { roleId } = req.params;
  const roleReader = new Role.Reader(behavior);
  roleReader.getById(roleId)
    .then((role) => {
      if (role === null) {
        return res.send(404, 'Role resource not found');
      }
      req.role = role;
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeRole(req, res, next) {
  const { role } = req;
  role.remove()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getAllRoles(req, res, next) {
  const { behavior } = req;
  const roleReader = new Role.Reader(behavior);
  roleReader
    .getAll()
    .then((roles) => {
      req.responseData = {
        code: 200,
        data: roles,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function updateRole(req, res, next) {
  const { role, validatedBody: body } = req;
  Object.assign(role, body);
  role.update()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function router(server) {
  server.post('/roles', validateRolePayload, getRoleBehavior, createRole, util.sendResponse);
  server.get('/roles', getRoleBehavior, getAllRoles, util.sendResponse);
  server.del('/roles/:roleId', getRoleBehavior, getRoleById, removeRole, util.sendResponse);
  server.put('/roles/:roleId', validateRolePayload, getRoleBehavior, getRoleById, updateRole, util.sendResponse);
}

module.exports = router;
