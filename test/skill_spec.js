const should = require('should');
const core = require('../lib/core');
const is = require('../lib/is');
const config = require('my-config');
const path = require('path');
const Base = require('../lib/core/base');

const Skill = core.Skill;
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
    skill = new core.Skill({
      name: 'nodejs',
      url: 'https://nodejs.org/en/',
    });
    skill.create(done);
  });
  it('Should create a new skill', (done) => {
    Skill.findById(skill.id, (err, existingSkill) => {
      if (err) return done(err);
      should(existingSkill instanceof Base).be.exactly(true);
      should(existingSkill.name).be.exactly(skill.name);
      should(existingSkill.url).be.exactly(skill.url);
      should(is.date(existingSkill.createdOn)).be.exactly(true);
      return done(null);
    });
  });
  it('Should get null if id not exists', (done) => {
    Skill.findById('notexists', (err, existingSkill) => {
      if (err) return done(err);
      should(existingSkill).be.exactly(null);
      return done(null);
    });
  });
  it('Should get new skill', (done) => {
    Skill.getAll((err, skills) => {
      if (err) return done(err);
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
    skill.remove(done);
  });
  after((done) => {
    core.removeDb(couchdbConf, done);
  });
});
