const request = require('request');
const core = require('./index');
const is = require('../is');
const util = require('../util');

class Base {
  constructor(opts) {
    this.type = opts.type;
    this.spec = Object.assign({
      createdOn: 'date',
      removedOn: 'date',
      updatedOn: 'date',
    }, opts.spec);
    Object.assign(this, opts.data);
    this.connection = core.getConnection();
  }
  validateDoc() {
    const errors = [];
    const data = {};
    for (const key of Object.keys(this.spec)) {
      const value = this.spec[key];
      if (this[key]) {
        // property exists in this
        if (is[value](this[key])) {
          data[key] = this[key];
        } else {
          errors.push({
            code: 'InvalidType',
            message: `Property ${key} must be ${value}`,
          });
        }
      }
    }
    return {
      errors,
      data,
    };
  }
  save(cb) {
    process.nextTick(() => {
      const validation = this.validateDoc();
      if (validation.errors && validation.errors.length) {
        return cb(validation.errors[0]);
      }
      const doc = validation.data;
      doc.type = this.type;
      if (!this.id) {
        this.id = util.getUuid();
      }
      if (this.rev) {
        doc._rev = this.rev;
      }
      doc._id = this.id;
      return request({
        url: `${this.connection.getConnectionUrl()}/${this.id}`,
        method: 'PUT',
        json: true,
        body: doc,
      }, (err, res, body) => {
        if (err) return cb(err);
        if (res.statusCode !== 201) {
          return cb(body);
        }
        this.id = body.id;
        this.rev = body.rev;
        return cb(null);
      });
    });
  }
  create(cb) {
    this.createdOn = util.getCurrentDate();
    this.save(cb);
  }
  update(cb) {
    process.nextTick(() => {
      this.updatedOn = util.getCurrentDate();
      if (!this.id) return cb(null);
      return this.save(cb);
    });
  }
  remove(cb) {
    process.nextTick(() => {
      this.removedOn = util.getCurrentDate();
      if (!this.id) return cb(null);
      return this.save(cb);
    });
  }
}

exports = module.exports = Base;

Base.getById = (id, cb) => {
  const connection = core.getConnection();
  request({
    url: `${connection.getConnectionUrl()}/${id}`,
    method: 'GET',
    json: true,
  }, (err, res, body) => {
    if (err) return cb(err);
    if (res.statusCode === 404) return cb(null, null);
    if (res.statusCode !== 200) {
      return cb(body);
    }
    const data = Object.assign({}, body);
    data.id = data._id;
    data.rev = data._rev;
    delete data._id;
    delete data._rev;
    return cb(null, data);
  });
};

Base.queryView = (opts, cb) => {
  const connection = core.getConnection();
  const type = opts.type;
  const viewName = opts.name;
  const params = opts.params || {};
  const transform = opts.transform || {};
  const transformKeys = Object.keys(transform);
  request({
    url: `${connection.getConnectionUrl()}/_design/${type}/_view/${viewName}`,
    method: 'GET',
    json: true,
    qs: params,
  }, (err, res, body) => {
    if (err) return cb(err);
    if (res.statusCode !== 200) {
      return cb(body);
    }
    const result = {
      totalRows: body.total_rows,
      rows: body.rows.map((r) => {
        const value = r.value;
        const linkedDoc = r.doc && r.value._id;
        if (!linkedDoc) {
          value.id = `${value._id}`;
          value.rev = `${value._rev}`;
          delete value._id;
          delete value._rev;
        }
        // check link doc
        if (linkedDoc) {
          value[r.doc.type] = Object.assign({}, r.doc);
          delete value._id;
        }
        return value;
      }),
    };
    if (transformKeys.length) {
      result.rows = result.rows.reduce((prev, curr, index, rows) => {
        const aux = curr;
        for (let i = 0; i < transformKeys.length; i += 1) {
          const value = aux[transformKeys[i]];
          if (value) {
            const transformValues = rows
              .slice(index - value.length, index)
              .map(row => row[transform[transformKeys[i]]]);
            aux[transformKeys[i]] = transformValues;
            prev.push(aux);
          }
        }
        return prev;
      }, []);
      result.totalRows = result.rows.length;
    }
    return cb(null, result);
  });
};
