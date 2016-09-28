const should = require('should');
const core = require('../lib/core');
const is = require('../lib/is');
const config = require('my-config');
const path = require('path');
const request = require('supertest');
const apiServer = require('../server');

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
    company = {
      name: 'Unosquare',
      url: 'http://www.unosquare.com/',
      location: {
        address: 'Av. Américas 1536 1A Col. Country Club',
        zip: 44637,
        city: 'Guadalajara',
        state: 'Jalisco',
      },
    };
    request(apiServer)
      .post('/companies')
      .type('application/json')
      .send(company)
      .expect(201)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data } = body;
        company.id = data.id;
        company.rev = data.rev;
        return done(null);
      });
  });
  it('Should create a new company', (done) => {
    request(apiServer)
      .get(`/companies/${company.id}`)
      .type('application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingCompany } = body;
        should(existingCompany.name).be.exactly(company.name);
        should(existingCompany.url).be.exactly(company.url);
        should(existingCompany.location).be.eql(company.location);
        should(is.date(existingCompany.createdOn)).be.exactly(true);
        return done(null);
      });
  });
  it('Should respond 400 if invalid body', (done) => {
    const badCompany = Object.assign({}, company);
    badCompany.name = 123;
    request(apiServer)
      .post('/companies')
      .type('application/json')
      .send(badCompany)
      .expect(400)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { message } = body;
        should(body.code).be.exactly(400);
        should(message.message).be.exactly('Property name must be string');
        return done(null);
      });
  });
  it('Should get null if id not exists', (done) => {
    request(apiServer)
      .get('/companies/notexists')
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingCompany } = body;
        should(existingCompany).be.exactly(null);
        return done(null);
      });
  });
  it('Should respond 404 when removing invalid company id', (done) => {
    request(apiServer)
      .delete('/companies/notexists')
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingCompany } = body;
        should(existingCompany).be.exactly(null);
        return done(null);
      });
  });
  it('Should get new company', (done) => {
    request(apiServer)
      .get('/companies')
      .type('application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: companies } = body;
        const testingCompanies = companies.rows.filter(p => p.id === company.id);
        const totalCompanies = companies.totalRows;
        should(testingCompanies).have.length(1);
        should(totalCompanies).be.exactly(1);
        should(testingCompanies[0].name).be.exactly(company.name);
        should(testingCompanies[0].url).be.exactly(company.url);
        should(testingCompanies[0].location).be.eql(company.location);
        should(is.date(testingCompanies[0].createdOn)).be.exactly(true);
        return done(null);
      });
  });
  afterEach((done) => {
    request(apiServer)
      .delete(`/companies/${company.id}`)
      .expect(204)
      .end(done);
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
