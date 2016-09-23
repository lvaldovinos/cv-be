const request = require('request');
const Connection = require('./connection');
const Project = require('./project');
const Company = require('./company');
const Skill = require('./skill');
const path = require('path');
const fs = require('fs');

let connection = null;
const core = exports;

core.createConnection = (opts) => {
  connection = new Connection(opts);
  return connection;
};

core.createDb = (opts, cb) => {
  request({
    url: `http://${opts.server}:${opts.port}/${opts.db}`,
    method: 'PUT',
    json: true,
  }, (err, res, body) => {
    if (err) return cb(err);
    if (body.error && body.error === 'file_exists') {
      return cb(null);
    }
    return cb(null);
  });
};

core.removeDb = (opts, cb) => {
  request({
    url: `http://${opts.server}:${opts.port}/${opts.db}`,
    method: 'DELETE',
    json: true,
  }, (err) => {
    if (err) return cb(err);
    return cb(null);
  });
};

core.saveDesign = (opts, cb) => {
  const designPath = opts.designPath;
  const type = opts.type;
  const designStream = fs.createReadStream(path.resolve(designPath));
  designStream
    .pipe(request({
      url: `${connection.getConnectionUrl()}/_design/${type}`,
      method: 'PUT',
      json: true,
    }))
    .on('error', cb.bind(core))
    .on('response', () => cb(null));
};

core.getConnection = () => connection;
core.Project = Project;
core.Company = Company;
core.Skill = Skill;
