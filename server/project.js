const { Project } = require('../lib/core');
const restify = require('restify');

// api
function getProjects(req, res, next) {
  // get all valid projects
  Project.getAllValid((err, projects) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    return res.send(projects);
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

module.exports = (server) => {
  server.get('/projects', getProjects);
  server.post('/projects', createProject);
};
