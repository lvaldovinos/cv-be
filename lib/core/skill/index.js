const Base = require('../base');

class Skill extends Base {
  constructor(opts) {
    super({
      type: 'skill',
      spec: {
        name: 'string',
        url: 'url',
      },
      data: opts,
    });
  }
}

exports = module.exports = Skill;

Skill.findById = (id, cb) => {
  Base.getById(id, (err, data) => {
    if (err) return cb(err);
    if (!data) return cb(null, null);
    return cb(null, new Skill(data));
  });
};

Skill.getAll = Base.queryView.bind(Skill, {
  type: 'skill',
  name: 'all',
});
