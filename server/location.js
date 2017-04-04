'use strict';

const { Location, behaviorFactory } = require('cv-core');
const restify = require('restify');
const util = require('../util');

const getLocationBehavior = util.getBehavior(behaviorFactory.types.LOCATION);

const locationSchema = {
  id: '/location',
  type: 'object',
  properties: {
    city: {
      type: 'string',
      format: 'onlyCharactersAndSpace',
    },
    country: {
      type: 'string',
      format: 'onlyCharactersAndSpace',
    },
  },
  required: [
    'city',
    'country',
  ],
};

const validateLocationPayload = util.bodyValidator({
  type: 'location',
  schema: locationSchema,
});

function createLocation(req, res, next) {
  const { validatedBody: body, behavior } = req;
  const newBody = Object.assign({}, body, {
    behavior,
  });
  Location.create(newBody)
    .then((location) => {
      req.responseData = {
        code: 201,
        data: {
          id: location.id,
        },
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getLocationById(req, res, next) {
  const { behavior } = req;
  const { locationId } = req.params;
  const locationReader = new Location.Reader(behavior);
  locationReader.getById(locationId)
    .then((location) => {
      if (location === null) {
        return res.send(404, 'Location resource not found');
      }
      req.location = location;
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function removeLocation(req, res, next) {
  const { location } = req;
  location.remove()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function updateLocation(req, res, next) {
  const { location, validatedBody: body } = req;
  Object.assign(location, body);
  location.update()
    .then(() => {
      req.responseData = {
        code: 204,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function getAllLocations(req, res, next) {
  const { behavior } = req;
  const locationReader = new Location.Reader(behavior);
  locationReader
    .getAll()
    .then((locations) => {
      req.responseData = {
        code: 200,
        data: locations,
      };
      return next(null);
    })
    .catch(err => next(new restify.errors.InternalServerError(err.message)));
}

function router(server) {
  server.post('/locations', validateLocationPayload, getLocationBehavior, createLocation, util.sendResponse);
  server.get('/locations', getLocationBehavior, getAllLocations, util.sendResponse);
  server.del('/locations/:locationId', getLocationBehavior, getLocationById, removeLocation, util.sendResponse);
  server.put('/locations/:locationId', validateLocationPayload, getLocationBehavior, getLocationById, updateLocation, util.sendResponse);
}

module.exports = router;
