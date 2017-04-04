'use strict';

const { Company, behaviorFactory } = require('cv-core');
const restify = require('restify');
const util = require('../util');

const getCompanyBehavior = util.getBehavior(behaviorFactory.types.COMPANY);

const companySchema = {
  id: '/company',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      format: 'alphaAndSpace',
    },
    webpage: {
      type: 'string',
      format: 'url',
    },
    imageUrl: {
      type: 'string',
      format: 'url',
    },
    locationId: {
      type: 'integer',
      format: 'greaterThan0',
    },
  },
  required: [
    'name',
    'webpage',
    'imageUrl',
  ],
};

const validateCompanyPayload = util.bodyValidator({
  type: 'company',
  schema: companySchema,
});

function createCompany(req, res, next) {
  const { validatedBody: body, behavior } = req;
  const newBody = Object.assign({}, body, {
    behavior,
  });
  Company.create(newBody)
    .then((company) => {
      req.responseData = {
        code: 201,
        data: {
          id: company.id,
        },
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getCompanyById(req, res, next) {
  const { behavior } = req;
  const { companyId } = req.params;
  const companyReader = new Company.Reader(behavior);
  companyReader.getById(companyId)
    .then((company) => {
      if (company === null) {
        return res.send(404, 'Company resource not found');
      }
      req.company = company;
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeCompany(req, res, next) {
  const { company } = req;
  company.remove()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function updateCompany(req, res, next) {
  const { company, validatedBody: body } = req;
  Object.assign(company, body);
  company.update()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getAllCompanies(req, res, next) {
  const { behavior } = req;
  const companyReader = new Company.Reader(behavior);
  companyReader
    .getAll()
    .then((companies) => {
      req.responseData = {
        code: 200,
        data: companies,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function router(server) {
  server.post('/companies', validateCompanyPayload, getCompanyBehavior, createCompany, util.sendResponse);
  server.get('/companies', getCompanyBehavior, getAllCompanies, util.sendResponse);
  server.del('/companies/:companyId', getCompanyBehavior, getCompanyById, removeCompany, util.sendResponse);
  server.put('/companies/:companyId', validateCompanyPayload, getCompanyBehavior, getCompanyById, updateCompany, util.sendResponse);
}

module.exports = router;
