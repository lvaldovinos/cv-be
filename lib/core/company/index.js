const Base = require('../base');

class Company extends Base {
  constructor(opts) {
    super({
      type: 'company',
      spec: {
        name: 'string',
        url: 'url',
        location: 'object',
      },
      data: opts,
    });
  }
}

exports = module.exports = Company;

Company.findById = (id, cb) => {
  Base.getById(id, (err, data) => {
    if (err) return cb(err);
    if (!data) return cb(null, null);
    return cb(null, new Company(data));
  });
};

Company.getAll = Base.queryView.bind(Company, {
  type: 'company',
  name: 'all',
});
