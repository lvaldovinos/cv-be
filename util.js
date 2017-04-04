'use strict';

const config = require('./config');
const winston = require('winston');
const { connectionFactory, behaviorFactory } = require('cv-core');
const { Validator } = require('jsonschema');
const restify = require('restify');

class InvalidPayloadError extends restify.RestError {
  constructor(message) {
    super({
      restCode: 'InvalidPayloadError',
      statusCode: 500,
      message,
      constructorOpt: InvalidPayloadError,
    });
    this.name = 'InvalidPayloadError';
  }
}

const util = exports;

util.bodyValidator = function bodyValidator({ type = 'instance', schema = {} }) {
  return (req, res, next) => {
    const { body } = req;
    const validator = new Validator();
    validator.customFormats.onlyCharactersAndSpace = (input) => {
      const charactersAndSpace = /^[a-zA-Z ]+$/g;
      return charactersAndSpace.test(input);
    };
    validator.customFormats.hexColor = (input) => {
      const hexColor = /^#[a-f0-9A-F]{6,6}$/g;
      return hexColor.test(input);
    };
    validator.customFormats.alphaAndSpace = (input) => {
      const characters = /^[\w ]+$/g;
      return characters.test(input);
    };
    validator.customFormats.url = (input) => {
      const url = /^(http|https):\/\/([\w-]+:[\w-]+)?@?((?:www)?\.?[\w-.]+)+:?([0-9]+)?(\/[\w-.]+)*\??(\w+=\w+)*#?(\w+)$/g;
      return url.test(input);
    };
    validator.customFormats.monthYear = (input) => {
      const monthYear = /[A-Z]{1,1}[a-z]{2,2} [0-9]{4,4}/g;
      return monthYear.test(input) || !input;
    };
    validator.customFormats.greaterThan0 = input => input > 0;
    const result = validator.validate(body, schema);
    if (result.errors.length > 0) {
      const errorMessage = result.errors
        .map(error => error.stack)
        .join(', ')
        .replace(/instance/g, type);
      return next(new InvalidPayloadError(errorMessage));
    }
    req.validatedBody = result.instance;
    delete req.body;
    return next(null);
  };
};

util.getBehavior = function getBehavior(type) {
  return (req, res, next) => {
    connectionFactory.sqlite({
      database: config.DATABASE,
      logger: winston,
    })
    .then((connection) => {
      const behavior = behaviorFactory.create({
        type,
        connection,
      });
      behavior.setConnection(connection);
      return behavior;
    })
    .then((behavior) => {
      req.behavior = behavior;
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
  };
};

util.sendResponse = function sendResponse(req, res, next) {
  const { code, data = null } = req.responseData;
  let { behavior } = req;
  let checkConnectionPromise = Promise.resolve();
  if (behavior.connection !== null) {
    checkConnectionPromise = behavior.closeConnection();
  }
  checkConnectionPromise
    .then(() => {
      behavior = null;
      return res.send(code, data);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
};
