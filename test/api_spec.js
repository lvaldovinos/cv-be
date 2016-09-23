const should = require('should');
const async = require('async');
const core = require('../lib/core');
const is = require('../lib/is');
const config = require('my-config');
const path = require('path');
const moment = require('moment');
const request = require('supertest');
const apiServer = require('../server');

const configPath = process.env.CONFIG;
const env = process.env.ENV;
let configuration = {};
let project = {};
let company = {};
let skill = {};
let couchdbConf = {};

describe('HTTP API test suite', () => {
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
    async.parallel([
      (callback) => {
        core.saveDesign({
          designPath: path.resolve(__dirname, '../lib/core/project/design.json'),
          type: 'project',
        }, callback);
      },
      (callback) => {
        core.saveDesign({
          designPath: path.resolve(__dirname, '../lib/core/company/design.json'),
          type: 'company',
        }, callback);
      },
    ], done);
  });
  before((done) => {
    skill = new core.Skill({
      name: 'nodejs',
      url: 'https://nodejs.org/en/',
    });
    skill.create(done);
  });
  before((done) => {
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
  beforeEach((done) => {
    project = {
      name: 'Bluejay',
      startDate: moment().format(),
      client: 'Foundation Medicine',
      location: {
        address: 'Av. Américas 1536 1A Col. Country Club',
        zip: 44637,
        city: 'Guadalajara',
        state: 'Jalisco',
      },
      description: 'bluejay is a tool built using angular and d3 in the FE',
      duties: [
        'Gather requirements from BI and transform them into reality',
      ],
      company: company.id,
      skills: [
        skill.id,
      ],
    };
    request(apiServer)
      .post('/projects')
      .type('application/json')
      .send(project)
      .expect(201)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data } = body;
        project.id = data.id;
        project.rev = data.rev;
        return done(null);
      });
  });
  it('Should create new project', (done) => {
    request(apiServer)
      .get('/projects')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: projects } = body;
        const testingProjects = projects.rows.filter(p => p.id === project.id);
        const totalProjects = projects.totalRows;
        should(testingProjects).have.length(1);
        should(totalProjects).be.exactly(1);
        should(testingProjects[0].name).be.exactly(project.name);
        should(testingProjects[0].startDate).be.exactly(project.startDate);
        should(testingProjects[0].client).be.exactly(project.client);
        should(testingProjects[0].location).be.eql(project.location);
        should(testingProjects[0].description).be.exactly(project.description);
        should(testingProjects[0].duties).be.eql(project.duties);
        should(is.date(testingProjects[0].createdOn)).be.exactly(true);
        should(testingProjects[0].company).be.an.Object();
        should(testingProjects[0].company.name).be.exactly(company.name);
        should(testingProjects[0].company.url).be.exactly(company.url);
        should(testingProjects[0].company.location).be.eql(company.location);
        const skills = testingProjects[0].skills;
        should(skills).be.an.Array();
        should(skills).have.length(1);
        should(skills[0].name).be.exactly(skill.name);
        should(skills[0].url).be.exactly(skill.url);
        return done(null);
      });
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
