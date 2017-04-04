#!/usr/bin/env node

'use strict';

const { connectionFactory, schemaBuilder } = require('cv-core');
const server = require('./server');
const winston = require('winston');
const config = require('./config');
const Promise = require('bluebird');
const packageJson = require('./package');

const [,, ...processArguments] = process.argv;

if (processArguments.length > 0) {
  const version = processArguments[0];
  if (version !== '--version') {
    winston.error('invalid argument');
    process.exit(-1);
  }
  process.stdout.write(`${packageJson.version}\n\r`);
  process.exit(0);
} else {
  connectionFactory.sqlite({
    database: config.DATABASE,
    logger: winston,
  })
  .then(conn => schemaBuilder.sqlite(conn)
    .then(() => conn))
    .then(connection => connection.close())
    .then(() => {
      server
        .listen(config.PORT, (error) => {
          if (error) {
            return Promise.reject(error);
          }
          return winston.info(`api listening on ${config.PORT} port`);
        });
    })
    .catch((error) => {
      winston.error(error.message);
      process.exit(-1);
    });
}
