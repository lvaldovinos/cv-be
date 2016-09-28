const { Company } = require('../lib/core');
const restify = require('restify');
const async = require('async');

function getCompanies(req, res, next) {
  Company.getAll((err, companies) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    return res.send(companies);
  });
}

function createCompanies(req, res, next) {
  const company = new Company(req.body);
  company.create((err) => {
    if (err && err.code === 'InvalidType') {
      return next(new restify.errors.InvalidContentError(err.message));
    }
    if (err) return next(new restify.errors.InternalServerError(err.message));
    const { id, rev } = company;
    return res.send(201, {
      id,
      rev,
    });
  });
}

function getCompanyById(req, res, next) {
  Company.findById(req.params.companyId, (err, existingCompany) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (existingCompany === null) return next(new restify.NotFoundError('Company id not found'));
    return res.send(existingCompany);
  });
}

function removeCompanyById(req, res, next) {
  async.waterfall([
    (callback) => {
      Company.findById(req.params.companyId, callback);
    },
    (existingCompany, callback) => {
      if (existingCompany === null) return callback(null, null);
      return existingCompany.remove(callback);
    },
  ], (err, result) => {
    if (err) return next(new restify.errors.InternalServerError(err.message));
    if (result === null) return next(new restify.NotFoundError('Company id not found'));
    return res.send(204, null);
  });
}

module.exports = (server) => {
  server.get('/companies', getCompanies);
  server.get('/companies/:companyId', getCompanyById);
  server.del('/companies/:companyId', removeCompanyById);
  server.post('/companies', createCompanies);
};
