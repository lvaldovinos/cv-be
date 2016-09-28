const { Skill } = require('../lib/core');
const restify = require('restify');
const async = require('async');

function getSkills(req, res, next) {
  Skill.getAll((err, skills) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    return res.send(skills);
  });
}

function createSkills(req, res, next) {
  const skill = new Skill(req.body);
  skill.create((err) => {
    if (err && err.code === 'InvalidType') {
      return next(new restify.errors.InvalidContentError(err.message));
    }
    if (err) return next(new restify.errors.InternalServerError(err.message));
    const { id, rev } = skill;
    return res.send(201, {
      id,
      rev,
    });
  });
}

function getSkillById(req, res, next) {
  Skill.findById(req.params.skillId, (err, existingSkill) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (existingSkill === null) return next(new restify.NotFoundError('Skill id not found'));
    return res.send(existingSkill);
  });
}

function removeSkillById(req, res, next) {
  async.waterfall([
    (callback) => {
      Skill.findById(req.params.skillId, callback);
    },
    (existingSkill, callback) => {
      if (existingSkill === null) return callback(null, null);
      return existingSkill.remove(callback);
    },
  ], (err, result) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (result === null) return next(new restify.NotFoundError('Skill id not found'));
    return res.send(204, null);
  });
}

module.exports = (server) => {
  server.get('/skills', getSkills);
  server.get('/skills/:skillId', getSkillById);
  server.del('/skills/:skillId', removeSkillById);
  server.post('/skills', createSkills);
};
