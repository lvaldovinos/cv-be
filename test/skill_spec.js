const should = require('should');
const core = require('../lib/core');
const is = require('../lib/is');
const config = require('my-config');
const path = require('path');
const apiServer = require('../server');
const request = require('supertest');

const configPath = process.env.CONFIG;
const env = process.env.ENV;
let configuration = {};
let skill = {};
let couchdbConf = {};

describe('lib/core/skill test suite', () => {
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
      designPath: path.resolve(__dirname, '../lib/core/skill/design.json'),
      type: 'skill',
    }, done);
  });
  beforeEach((done) => {
    skill = {
      name: 'nodejs',
      url: 'https://nodejs.org/en/',
    };
    request(apiServer)
      .post('/skills')
      .type('application/json')
      .send(skill)
      .expect(201)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data } = body;
        skill.id = data.id;
        skill.rev = data.rev;
        return done(null);
      });
  });
  it('Should create a new skill', (done) => {
    request(apiServer)
      .get(`/skills/${skill.id}`)
      .type('application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingSkill } = body;
        should(existingSkill.name).be.exactly(skill.name);
        should(existingSkill.url).be.exactly(skill.url);
        should(is.date(existingSkill.createdOn)).be.exactly(true);
        return done(null);
      });
  });
  it('Should respond 400 if invalid body', (done) => {
    const badSkill = Object.assign({}, skill);
    badSkill.name = 123;
    request(apiServer)
      .post('/skills')
      .type('application/json')
      .send(badSkill)
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
      .get('/skills/notexists')
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        const { data: existingSkill } = body;
        if (err) return done(err);
        should(existingSkill).be.exactly(null);
        return done(null);
      });
  });
  it('Should respond 404 when removing invalid skill id', (done) => {
    request(apiServer)
      .delete('/skills/notexists')
      .type('application/json')
      .expect(404)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: existingSkill } = body;
        should(existingSkill).be.exactly(null);
        return done(null);
      });
  });
  it('Should get new skill', (done) => {
    request(apiServer)
      .get('/skills')
      .type('application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, { body }) => {
        if (err) return done(err);
        const { data: skills } = body;
        const testingSkills = skills.rows.filter(p => p.id === skill.id);
        const totalSkills = skills.totalRows;
        should(testingSkills).have.length(1);
        should(totalSkills).be.exactly(1);
        should(testingSkills[0].name).be.exactly(skill.name);
        should(testingSkills[0].url).be.exactly(skill.url);
        should(is.date(testingSkills[0].createdOn)).be.exactly(true);
        return done(null);
      });
  });
  afterEach((done) => {
    request(apiServer)
      .delete(`/skills/${skill.id}`)
      .expect(204)
      .end(done);
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
