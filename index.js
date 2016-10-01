#!/usr/bin/env node

const program = require('commander');
const packageJson = require('./package.json');
const is = require('./lib/is');
const server = require('./server');
const config = require('my-config');
const core = require('./lib/core');
const winston = require('winston');
const async = require('async');
const path = require('path');

program
  .version(packageJson.version)
  .option('-e, --environment [value]', 'Application settings in speficic environment');

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
} else {
  if (!is.string(program.environment) && !(program.environment && program.environment.length)) {
    winston.error('Please provide an environment');
    process.exit(1);
  }

  const env = program.environment;
  const configuration = config.init({
    path: 'config.json',
    env,
  });

  if (!is.object(configuration.couchdb)) {
    winston.error('Please provide a valid environment which exists in config.json');
    process.exit(1);
  }

  async.series([
    // create database if not exists
    callback => core.createDb(configuration.couchdb, callback),
    // connect to database
    (callback) => {
      winston.info('Connecting to couchdb server...');
      core
        .createConnection(configuration.couchdb)
        .once('error', callback)
        .once('connect', () => {
          winston.info('Connected to couchdb server');
          callback();
        });
    },
    // create company design document
    (callback) => {
      core.saveDesign({
        designPath: path.resolve(__dirname, './lib/core/company/design.json'),
        type: 'company',
      }, callback);
    },
    // create skill design document
    (callback) => {
      core.saveDesign({
        designPath: path.resolve(__dirname, './lib/core/skill/design.json'),
        type: 'skill',
      }, callback);
    },
    // create project design document
    (callback) => {
      core.saveDesign({
        designPath: path.resolve(__dirname, './lib/core/project/design.json'),
        type: 'project',
      }, callback);
    },
    // connect to couchdb server
    callback => server.listen(configuration.port, callback),
  ], (err) => {
    if (err) {
      winston.error(err.message, err);
      process.exit(1);
    }
    winston.info(`Listening on port ${configuration.port}`);
  });
}
