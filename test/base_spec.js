const should = require('should');
const core = require('../lib/core');
const Base = require('../lib/core/base');
const config = require('my-config');
const path = require('path');

let myBase = {};
const configPath = process.env.CONFIG;
const env = process.env.ENV;
let configuration = {};
let couchdbConf = {};

describe('lib/base.js test suite', () => {
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
  before((done) => {
    core
      .createConnection(couchdbConf)
      .once('error', done)
      .once('connect', done);
  });
  beforeEach(() => {
    myBase = new Base({
      type: 'dummy',
      spec: {
        string: 'string',
        url: 'url',
      },
      data: {
        string: 1324,
        url: '1324',
      },
    });
  });
  it('Should throw InvalidType error', () => {
    const result = myBase.validateDoc();
    should(result.errors).be.an.Array();
    should(result.errors).have.length(2);
    should(result.errors[0].code).be.exactly('InvalidType');
    should(result.errors[0].message).be.exactly('Property string must be string');
  });
  it('Should try to save bad document, expect InvalidType error', (done) => {
    myBase.create((err) => {
      should(err).have.properties(['code', 'message']);
      should(err.code).be.exactly('InvalidType');
      should(err.message).be.exactly('Property string must be string');
      done(null);
    });
  });
  afterEach(() => {
    myBase = null;
  });
});
