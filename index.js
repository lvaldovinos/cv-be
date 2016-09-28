#!/usr/bin/env node

const is = require('./lib/is');
const server = require('./server');
const config = require('my-config');
const core = require('./lib/core');
const winston = require('winston');

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

// connect to couchdb server
winston.info('Connecting to couchdb server...');
core
  .createConnection(configuration.couchdb)
  .once('error', (err) => {
    throw new Error(err.message);
  })
  .once('connect', () => {
    // connection successfull, let's start server
    winston.info('Connected to couchdb server');
    server
      .listen(configuration.port, (err) => {
        if (err) throw err;
        winston.info(`Listening on port ${configuration.port}`);
      });
  });

