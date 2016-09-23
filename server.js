const restify = require('restify');
const packageJson = require('./package.json');
const { Project, Company, Skill } = require('./lib/core');

const server = restify.createServer({
  name: 'cv-be',
  version: packageJson.version,
  formatters: {
    'application/json': (req, res, body, cb) => {
      const response = {
        code: res.statusCode,
        getStatus: function getStatus() {
          if (this.code >= 500 && this.code < 600) return 'fail';
          if (this.code >= 400 && this.code < 500) return 'error';
          return 'success';
        },
        getFinal: function getFinal() {
          const { code, message, data } = this;
          return {
            code,
            status: this.getStatus(),
            message,
            data,
          };
        },
      };
      if (Buffer.isBuffer(body)) return cb(null, body.toString('base64'));
      if (body instanceof Error) {
        response.code = body.statusCode;
        response.message = body.body;
        response.data = null;
        return cb(null, JSON.stringify(response.getFinal()));
      }
      response.message = null;
      response.data = body;
      return cb(null, JSON.stringify(response.getFinal()));
    },
  },
});
// body parser
server.use(restify.bodyParser({
  maxBodySize: ((1024 * 1024) * 5),
}));
// cors
server.use(restify.CORS());
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
function getCompanies(req, res, next) {
  Company.getAll((err, companies) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    return res.send(companies);
  });
}
function getSkills(req, res, next) {
  Skill.getAll((err, skills) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    return res.send(skills);
  });
}
server.get('/companies', getCompanies);
server.get('/skills', getSkills);
server.get('/projects', getProjects);
server.post('/projects', createProject);
// 404 notfound
server.use((req, res, next) => next(new restify.NotFoundError()));

module.exports = server;
