const { Project } = require('../lib/core');
const restify = require('restify');
const async = require('async');

// api
function getProjects(req, res, next) {
  // get all valid projects
  Project.getAllValid((err, projects) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    return res.send(projects);
  });
}

function getProjectById(req, res, next) {
  Project.findById(req.params.projectId, (err, existingProject) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (existingProject === null) return next(new restify.NotFoundError('Project id not found'));
    return res.send(existingProject);
  });
}

function createProject(req, res, next) {
  const project = new Project(req.body);
  project.create((err) => {
    if (err && err.code === 'InvalidType') {
      return next(new restify.errors.InvalidContentError(err.message));
    }
    if (err) return next(new restify.errors.InternalServerError(err.message));
    const { id, rev } = project;
    return res.send(201, {
      id,
      rev,
    });
  });
}

function removeProjectById(req, res, next) {
  async.waterfall([
    (callback) => {
      Project.findById(req.params.projectId, callback);
    },
    (existingProject, callback) => {
      if (existingProject === null) return callback(null, null);
      return existingProject.remove(callback);
    },
  ], (err, result) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (result === null) return next(new restify.NotFoundError('Project id not found'));
    return res.send(204, null);
  });
}

function updateProjectById(req, res, next) {
  async.waterfall([
    (callback) => {
      Project.findById(req.params.projectId, callback);
    },
    (existingProject, callback) => {
      if (existingProject === null) return callback(null, null);
      Object.assign(existingProject, req.body);
      return existingProject.update(callback);
    },
  ], (err, result) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (result === null) return next(new restify.NotFoundError('Project id not found'));
    return res.send(204, null);
  });
}

module.exports = (server) => {
  server.get('/projects', getProjects);
  server.get('/projects/:projectId', getProjectById);
  server.del('/projects/:projectId', removeProjectById);
  server.put('/projects/:projectId', updateProjectById);
  server.post('/projects', createProject);
};
