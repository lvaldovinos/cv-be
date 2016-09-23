const should = require('should');
const core = require('../lib/core');
const is = require('../lib/is');
const config = require('my-config');
const path = require('path');
const Base = require('../lib/core/base');

const Company = core.Company;
const configPath = process.env.CONFIG;
const env = process.env.ENV;
let configuration = {};
let company = {};
let couchdbConf = {};

describe('lib/core/company test suite', () => {
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
  before((done) => {
    core.saveDesign({
      designPath: path.resolve(__dirname, '../lib/core/company/design.json'),
      type: 'company',
    }, done);
  });
  beforeEach((done) => {
    company = new core.Company({
      name: 'Unosquare',
      url: 'http://www.unosquare.com/',
      location: {
        address: 'Av. Américas 1536 1A Col. Country Club',
        zip: 44637,
        city: 'Guadalajara',
        state: 'Jalisco',
      },
    });
    company.create(done);
  });
  it('Should create a new company', (done) => {
    Company.findById(company.id, (err, existingCompany) => {
      if (err) return done(err);
      should(existingCompany instanceof Base).be.exactly(true);
      should(existingCompany.name).be.exactly(company.name);
      should(existingCompany.url).be.exactly(company.url);
      should(existingCompany.location).be.eql(company.location);
      should(is.date(existingCompany.createdOn)).be.exactly(true);
      return done(null);
    });
  });
  it('Should get null if id not exists', (done) => {
    Company.findById('notexists', (err, existingCompany) => {
      if (err) return done(err);
      should(existingCompany).be.exactly(null);
      return done(null);
    });
  });
  it('Should get new company', (done) => {
    Company.getAll((err, companys) => {
      if (err) return done(err);
      const testingCompanys = companys.rows.filter(p => p.id === company.id);
      const totalCompanys = companys.totalRows;
      should(testingCompanys).have.length(1);
      should(totalCompanys).be.exactly(1);
      should(testingCompanys[0].name).be.exactly(company.name);
      should(testingCompanys[0].url).be.exactly(company.url);
      should(testingCompanys[0].location).be.eql(company.location);
      should(is.date(testingCompanys[0].createdOn)).be.exactly(true);
      return done(null);
    });
  });
  afterEach((done) => {
    company.remove(done);
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
