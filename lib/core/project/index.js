const Base = require('../base');

class Project extends Base {
  constructor(opts) {
    super({
      type: 'project',
      spec: {
        name: 'string',
        startDate: 'date',
        finishDate: 'date',
        client: 'string',
        location: 'object',
        description: 'string',
        duties: 'array',
        company: 'string',
        skills: 'array',
      },
      data: opts,
    });
    this.skills = opts.skills || [];
  }
  assignCompany(company) {
    this.company = company.id;
    return this;
  }
  addSkill(skill) {
    this.skills.push(skill.id);
    return this;
  }
}

exports = module.exports = Project;

Project.findById = (id, cb) => {
  Base.getById(id, (err, data) => {
    if (err) return cb(err);
    if (!data) return cb(null, null);
    return cb(null, new Project(data));
  });
};

Project.getAll = Base.queryView.bind(Project, {
  type: 'project',
  name: 'all',
});

Project.getAllValid = Base.queryView.bind(Project, {
  type: 'project',
  name: 'allValid',
  params: {
    include_docs: true,
  },
  transform: {
    skills: 'skill',
  },
});
