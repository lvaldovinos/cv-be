'use strict';

const should = require('should');
const request = require('supertest');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const { connectionFactory, schemaBuilder } = require('cv-core');
const server = require('../server');
const winston = require('winston');
const config = require('../config');

let location = {};

describe('location test suite', () => {
  before((done) => {
    // create schema
    connectionFactory.sqlite({
      database: config.DATABASE,
      logger: winston,
    })
    .then(conn => schemaBuilder.sqlite(conn)
      .then(() => conn))
    .then(conn => conn.close())
    .then(() => done(null))
    .catch(done);
  });
  beforeEach((done) => {
    location = {
      city: 'Guadalajara',
      country: 'Mex',
    };
    request(server)
      .post('/locations')
      .send(location)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((response) => {
        const { body } = response;
        const { data } = body;
        should(data.id).be.a.Number();
        should(data.id > 0).be.exactly(true);
        location.id = data.id;
        return done(null);
      })
      .catch(done);
  });
  it('get all locations', (done) => {
    request(server)
      .get('/locations')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        const { data: locations } = body;
        should(locations).be.an.Array();
        should(locations).have.length(1);
        should(locations[0]).have.properties([
          'city',
          'id',
          'country',
        ]);
        should(locations[0].city).be.exactly('Guadalajara');
        should(locations[0].country).be.exactly('Mex');
        should(locations[0].id).be.exactly(location.id);
        return done(null);
      })
      .catch(done);
  });
  it('remove location by id not resource found', (done) => {
    request(server)
      .del('/locations/0')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(({ body }) => {
        const { data } = body;
        should(data).be.exactly('Location resource not found');
        return done(null);
      })
      .catch(done);
  });
  it('update location', (done) => {
    request(server)
      .put(`/locations/${location.id}`)
      .send({
        city: 'Colima',
        country: 'Mexico',
      })
      .expect(204)
      .then(() => request(server)
        .get('/locations')
        .expect(200))
      .then(({ body }) => {
        const { data: locations } = body;
        should(locations).be.an.Array();
        should(locations).have.length(1);
        should(locations[0]).have.properties([
          'city',
          'id',
          'country',
        ]);
        should(locations[0].city).be.exactly('Colima');
        should(locations[0].country).be.exactly('Mexico');
        should(locations[0].id).be.exactly(location.id);
        return done(null);
      })
      .catch(done);
  });
  it('create location - throw 500 if invalid paylod', (done) => {
    request(server)
      .post('/locations')
      .send({
        city: 'Guadalajara',
        country: 'Mex2',
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('location.country does not conform to the "onlyCharactersAndSpace" format');
        return done(null);
      })
      .catch(done);
  });
  it('update location - throw 500 if invalid payload', (done) => {
    request(server)
      .put(`/locations/${location.id}`)
      .send({
        city: 2,
        country: 'Mex',
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('location.city is not of a type(s) string, location.city does not conform to the "onlyCharactersAndSpace" format');
        return done(null);
      })
      .catch(done);
  });
  afterEach((done) => {
    request(server)
      .del(`/locations/${location.id}`)
      .expect(204)
      .then(() => {
        location = null;
        return done(null);
      })
      .catch(done);
  });
  after((done) => {
    fs.unlinkAsync(config.DATABASE)
      .then(() => done(null))
      .catch(done);
  });
});
