const should = require('should');
const core = require('../lib/core');
const config = require('my-config');
const path = require('path');

const configPath = process.env.CONFIG;
const env = process.env.ENV;
let configuration = {};
let connection = {};
let couchdbConf = {};

describe('lib/core test suite', () => {
  // get configuration
  before((done) => {
    config.init({
      path: path.resolve(configPath),
      env,
    }, (err, c) => {
      if (err) return done(err);
      configuration = c;
      couchdbConf = Object.assign({}, configuration.couchdb);
      couchdbConf.db = `testing-${couchdbConf.db}`;
      return done(null);
    });
  });
  before((done) => {
    core.createDb(couchdbConf, done);
  });
  beforeEach((done) => {
    connection = core.createConnection(couchdbConf);
    connection
      .once('error', done)
      .once('connect', done);
  });
  it('Should try to create an existing databse', (done) => {
    core.createDb(couchdbConf, (err) => {
      if (err) return done(err);
      should(err).be.exactly(null);
      return done(null);
    });
  });
  it('Should connect to a couchdb server', () => {
    should(connection.connected).be.exactly(true);
    should(connection.getConnectionUrl()).not.be.empty();
    should(core.getConnection()).be.exactly(connection);
  });
  it('Should throw an error when invalid server/port', (done) => {
    const badConnection = core.createConnection({
      server: 'localhost',
      port: 1234,
      db: 'cv',
    });
    badConnection
      .once('error', (error) => {
        should(error).be.ok();
        should(badConnection.connected).be.exactly(false);
        should(badConnection.getConnectionUrl()).be.exactly(null);
        done(null);
      });
  });
  it('Should throw an error when connecting to wrong database', (done) => {
    const badConnection = core.createConnection({
      server: 'localhost',
      port: 5984,
      db: 'notexists',
    });
    badConnection
      .once('error', (error) => {
        should(error).be.ok();
        should(badConnection.connected).be.exactly(false);
        should(badConnection.getConnectionUrl()).be.exactly(null);
        should(error.code).be.exactly('NOTEXISTS');
        should(error.message).be.exactly('Database does not exist');
        done(null);
      });
  });
  it('Should throw an error when creating wrong database', (done) => {
    core.createDb({
      server: 'localhost',
      port: 1234,
      db: 'cv',
    }, (err) => {
      should(err).be.ok();
      return done(null);
    });
  });
  it('Should throw an error when removing wrong database', (done) => {
    core.removeDb({
      server: 'localhost',
      port: 1234,
      db: 'cv',
    }, (err) => {
      should(err).be.ok();
      return done(null);
    });
  });
  afterEach(() => {
    connection.destroy();
    connection = null;
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
