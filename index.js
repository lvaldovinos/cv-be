#!/usr/bin/env node

const is = require('./lib/is');
const server = require('./server');
const config = require('my-config');
const core = require('./lib/core');
const winston = require('winston');
const async = require('async');
const path = require('path');

const env = process.argv[2] || null;

if (!is.string(env) && !(env && env.length)) {
  throw new Error('Please provide an environment');
}

const configuration = config.init({
  path: 'config.json',
  env,
});

if (!is.object(configuration.couchdb)) {
  throw new Error('Please provide a valid environment which exists in config.json');
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
  if (err) throw err;
  winston.info(`Listening on port ${configuration.port}`);
});

