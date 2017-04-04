'use strict';

const { Project, Role, Tool, behaviorFactory } = require('cv-core');
const restify = require('restify');
const util = require('../util');

const getProjectBehavior = util.getBehavior(behaviorFactory.types.PROJECT);

const projectSchema = {
  id: '/project',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      format: 'alphaAndSpace',
    },
    startDate: {
      type: 'string',
      format: 'monthYear',
    },
    endDate: {
      type: [
        'string',
        'null',
      ],
      format: 'monthYear',
    },
    highlight: {
      type: 'string',
    },
    clientId: {
      type: 'integer',
      format: 'greaterThan0',
    },
    vendorId: {
      type: 'integer',
      format: 'greaterThan0',
    },
  },
  required: [
    'name',
    'startDate',
    'highlight',
    'clientId',
    'vendorId',
  ],
};

const validateProjectPayload = util.bodyValidator({
  type: 'project',
  schema: projectSchema,
});

const validateProjectRoleAssignmentPayload = util.bodyValidator({
  type: 'projectRole',
  schema: {
    id: '/projectRole',
    type: 'object',
    properties: {
      roleId: {
        type: 'integer',
        format: 'greaterThan0',
      },
    },
    required: [
      'roleId',
    ],
  },
});

const validateProjectToolAssignmentPayload = util.bodyValidator({
  type: 'projectTool',
  schema: {
    id: '/projectTool',
    type: 'object',
    properties: {
      toolId: {
        type: 'integer',
        format: 'greaterThan0',
      },
    },
    required: [
      'toolId',
    ],
  },
});

function createProject(req, res, next) {
  const { validatedBody: body, behavior } = req;
  const newBody = Object.assign({}, body, {
    behavior,
  });
  Project.create(newBody)
    .then((project) => {
      req.responseData = {
        code: 201,
        data: {
          id: project.id,
        },
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getProjectById(req, res, next) {
  const { behavior } = req;
  const { projectId } = req.params;
  const projectReader = new Project.Reader(behavior);
  projectReader.getById(projectId)
    .then((project) => {
      if (project === null) {
        return res.send(404, 'Project resource not found');
      }
      req.project = project;
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeProject(req, res, next) {
  const { project } = req;
  project.remove()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function updateProject(req, res, next) {
  const { project, validatedBody: body } = req;
  Object.assign(project, body);
  project.update()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getAllProjects(req, res, next) {
  const { behavior } = req;
  const projectReader = new Project.Reader(behavior);
  projectReader
    .getAll()
    .then((projects) => {
      req.responseData = {
        code: 200,
        data: projects,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function addRoleToProject(req, res, next) {
  const { project, validatedBody: body, behavior } = req;
  const roleBehavior = behaviorFactory.create({
    connection: behavior.connection,
    type: behaviorFactory.types.ROLE,
  });
  roleBehavior.setConnection(behavior.connection);
  const roleReader = new Role.Reader(roleBehavior);
  roleReader.getById(body.roleId)
    .then(role => project.addRole(role))
    .then(() => {
      req.responseData = {
        code: 201,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeRoleFromProject(req, res, next) {
  const { project, behavior, params } = req;
  const { roleId } = params;
  const roleBehavior = behaviorFactory.create({
    connection: behavior.connection,
    type: behaviorFactory.types.ROLE,
  });
  roleBehavior.setConnection(behavior.connection);
  const roleReader = new Role.Reader(roleBehavior);
  roleReader.getById(roleId)
    .then(role => project.removeRole(role))
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getRolesByProject(req, res, next) {
  const { project, behavior } = req;
  const roleBehavior = behaviorFactory.create({
    connection: behavior.connection,
    type: behaviorFactory.types.ROLE,
  });
  roleBehavior.setConnection(behavior.connection);
  const roleReader = new Role.Reader(roleBehavior);
  roleReader.getByProjectId(project.id)
    .then((roles) => {
      req.responseData = {
        code: 200,
        data: roles,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function addToolToProject(req, res, next) {
  const { project, validatedBody: body, behavior } = req;
  const toolBehavior = behaviorFactory.create({
    connection: behavior.connection,
    type: behaviorFactory.types.TOOL,
  });
  toolBehavior.setConnection(behavior.connection);
  const toolReader = new Tool.Reader(toolBehavior);
  toolReader.getById(body.toolId)
    .then(tool => project.addTool(tool))
    .then(() => {
      req.responseData = {
        code: 201,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getToolsByProject(req, res, next) {
  const { project, behavior } = req;
  const toolBehavior = behaviorFactory.create({
    connection: behavior.connection,
    type: behaviorFactory.types.TOOL,
  });
  toolBehavior.setConnection(behavior.connection);
  const toolReader = new Tool.Reader(toolBehavior);
  toolReader.getByProjectId(project.id)
    .then((tools) => {
      req.responseData = {
        code: 200,
        data: tools,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeToolFromProject(req, res, next) {
  const { project, behavior, params } = req;
  const { toolId } = params;
  const toolBehavior = behaviorFactory.create({
    connection: behavior.connection,
    type: behaviorFactory.types.TOOL,
  });
  toolBehavior.setConnection(behavior.connection);
  const toolReader = new Tool.Reader(toolBehavior);
  toolReader.getById(toolId)
    .then(tool => project.removeTool(tool))
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function router(server) {
  server.post('/projects', validateProjectPayload, getProjectBehavior, createProject, util.sendResponse);
  server.get('/projects', getProjectBehavior, getAllProjects, util.sendResponse);
  server.del('/projects/:projectId', getProjectBehavior, getProjectById, removeProject, util.sendResponse);
  server.put('/projects/:projectId', validateProjectPayload, getProjectBehavior, getProjectById, updateProject, util.sendResponse);
  server.post('/projects/:projectId/roles', validateProjectRoleAssignmentPayload, getProjectBehavior, getProjectById, addRoleToProject, util.sendResponse);
  server.get('/projects/:projectId/roles', getProjectBehavior, getProjectById, getRolesByProject, util.sendResponse);
  server.del('/projects/:projectId/roles/:roleId', getProjectBehavior, getProjectById, removeRoleFromProject, util.sendResponse);
  server.post('/projects/:projectId/tools', validateProjectToolAssignmentPayload, getProjectBehavior, getProjectById, addToolToProject, util.sendResponse);
  server.get('/projects/:projectId/tools', getProjectBehavior, getProjectById, getToolsByProject, util.sendResponse);
  server.del('/projects/:projectId/tools/:toolId', getProjectBehavior, getProjectById, removeToolFromProject, util.sendResponse);
}

module.exports = router;
