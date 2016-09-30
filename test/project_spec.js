const should = require('should');
const async = require('async');
const core = require('../lib/core');
const is = require('../lib/is');
const config = require('my-config');
const path = require('path');
const moment = require('moment');
const apiServer = require('../server');
const request = require('supertest');

const configPath = process.env.CONFIG;
const env = process.env.ENV;
let configuration = {};
let skill = {};
let company = {};
let project = {};
let couchdbConf = {};

describe('lib/core/project test suite', () => {
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
      designPath: path.resolve(__dirname, '../lib/core/project/design.json'),
      type: 'project',
    }, done);
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
  it('Should create a new project', (done) => {
    request(apiServer)
      .get(`/projects/${project.id}`)
      .type('application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingProject } = body;
        should(existingProject.name).be.exactly(project.name);
        should(existingProject.startDate).be.exactly(project.startDate);
        should(existingProject.client).be.exactly(project.client);
        should(existingProject.location).be.eql(project.location);
        should(existingProject.description).be.exactly(project.description);
        should(existingProject.duties).be.eql(project.duties);
        should(is.date(existingProject.createdOn)).be.exactly(true);
        return done(null);
      });
  });
  it('Should respond 400 if invalid body', (done) => {
    const badProject = Object.assign({}, project);
    badProject.name = 123;
    request(apiServer)
      .post('/projects')
      .type('application/json')
      .send(badProject)
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
      .get('/projects/notexists')
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingProject } = body;
        should(existingProject).be.exactly(null);
        return done(null);
      });
  });
  it('Should respond 404 when removing invalid project id', (done) => {
    request(apiServer)
      .delete('/projects/notexists')
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingProject } = body;
        should(existingProject).be.exactly(null);
        return done(null);
      });
  });
  it('Should get new project', (done) => {
    request(apiServer)
      .get('/projects')
      .type('application/json')
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
        return done(null);
      });
  });
  it('Should be able to update a project', (done) => {
    setTimeout(() => {
      project.name = 'Updated Name';
      project.client = 'Updated Client';
      project.location = {
        address: 'Av. Updated Américas 1536 1A Col. Country Club',
        zip: 1234,
        city: 'Updated Guadalajara',
        state: 'Updated Jalisco',
      };
      project.description = 'Updated description';
      project.duties = ['Updated duties'];
      async.series([
        (callback) => {
          request(apiServer)
            .put(`/projects/${project.id}`)
            .send(project)
            .type('application/json')
            .expect(204)
            .end(callback);
        },
        (callback) => {
          request(apiServer)
            .get(`/projects/${project.id}`)
            .type('application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, { body }) => {
              if (err) return done(err);
              const { data: updatedProject } = body;
              should(updatedProject.name).be.exactly(project.name);
              should(updatedProject.startDate).be.exactly(project.startDate);
              should(updatedProject.client).be.exactly(project.client);
              should(updatedProject.location).be.eql(project.location);
              should(updatedProject.description).be.exactly(project.description);
              should(updatedProject.duties).be.eql(project.duties);
              should(is.date(updatedProject.createdOn)).be.exactly(true);
              should(is.date(updatedProject.updatedOn)).be.exactly(true);
              should(moment(updatedProject.updatedOn)
                .isAfter(moment(updatedProject.createdOn)))
                .be.exactly(true);
              return callback(null);
            });
        },
      ], done);
    }, 1000);
  });
  it('Should respond 404 when updating project which does not exist', (done) => {
    request(apiServer)
      .put('/projects/notexists')
      .send(project)
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingProject } = body;
        should(existingProject).be.exactly(null);
        return done(null);
      });
  });
  afterEach((done) => {
    request(apiServer)
      .delete(`/projects/${project.id}`)
      .expect(204)
      .end(done);
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
