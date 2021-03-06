'use strict';

const restify = require('restify');
const packageJson = require('../package.json');
const locationRouter = require('./location');
const roleRouter = require('./role');
const toolRouter = require('./tool');
const companyRouter = require('./company');
const projectRouter = require('./project');

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

// routers
locationRouter(server);
roleRouter(server);
toolRouter(server);
companyRouter(server);
projectRouter(server);

// 404 notfound
server.use((req, res, next) => next(new restify.NotFoundError()));

module.exports = server;
