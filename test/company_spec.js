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
let company = {};

describe('company test suite', () => {
  before((done) => {
    // create schema
    connectionFactory.sqlite({
      database: config.DATABASE,
      logger: winston,
    })
    .then(conn => schemaBuilder.sqlite(conn)
      .then(() => conn))
    .then(conn => conn.close())
    .then(() => {
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
        });
    })
    .catch(done);
  });
  beforeEach((done) => {
    company = {
      name: 'unosquare',
      webpage: 'https://www.unosquare.com',
      imageUrl: 'https://www.unosquare.com/images/logo_178.png',
      locationId: location.id,
    };
    request(server)
      .post('/companies')
      .send(company)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((response) => {
        const { body } = response;
        const { data } = body;
        should(data.id).be.a.Number();
        should(data.id > 0).be.exactly(true);
        company.id = data.id;
        return done(null);
      })
      .catch(done);
  });
  it('get all companies', (done) => {
    request(server)
      .get('/companies')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        const { data: companies } = body;
        should(companies).be.an.Array();
        should(companies).have.length(1);
        should(companies[0]).have.properties([
          'name',
          'id',
          'webpage',
          'imageUrl',
          'locationId',
        ]);
        should(companies[0].name).be.exactly('unosquare');
        should(companies[0].webpage).be.exactly('https://www.unosquare.com');
        should(companies[0].imageUrl).be.exactly('https://www.unosquare.com/images/logo_178.png');
        should(companies[0].id).be.exactly(company.id);
        should(companies[0].locationId).be.exactly(location.id);
        return done(null);
      })
      .catch(done);
  });
  it('remove company by id not resource found', (done) => {
    request(server)
      .del('/companies/0')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(({ body }) => {
        const { data } = body;
        should(data).be.exactly('Company resource not found');
        return done(null);
      })
      .catch(done);
  });
  it('update company', (done) => {
    request(server)
      .put(`/companies/${company.id}`)
      .send({
        name: 'unosquare update',
        webpage: 'https://www.unosquare.com/update',
        imageUrl: 'https://www.unosquare.com/images/logo_178.png/update',
        locationId: location.id,
      })
      .expect(204)
      .then(() => request(server)
        .get('/companies')
        .expect(200))
      .then(({ body }) => {
        const { data: companies } = body;
        should(companies).be.an.Array();
        should(companies).have.length(1);
        should(companies[0]).have.properties([
          'name',
          'id',
          'webpage',
          'imageUrl',
          'locationId',
        ]);
        should(companies[0].name).be.exactly('unosquare update');
        should(companies[0].webpage).be.exactly('https://www.unosquare.com/update');
        should(companies[0].imageUrl).be.exactly('https://www.unosquare.com/images/logo_178.png/update');
        should(companies[0].id).be.exactly(company.id);
        should(companies[0].locationId).be.exactly(location.id);
        return done(null);
      })
      .catch(done);
  });
  it('create company - throw 500 if invalid paylod', (done) => {
    request(server)
      .post('/companies')
      .send({
        name: 'unosquare',
        webpage: 'https://www.unosquare.com/alsjdf!',
        imageUrl: 'https://www.unosquare.com/images/logo_178.png',
        locationId: location.id,
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('company.webpage does not conform to the "url" format');
        return done(null);
      })
      .catch(done);
  });
  it('update company - throw 500 if invalid payload', (done) => {
    request(server)
      .put(`/companies/${company.id}`)
      .send({
        name: 'unosquare',
        webpage: 'https://www.unosquare.com',
        imageUrl: 'https://www.unosquare.com/images/logo_178.png',
        locationId: 0,
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('company.locationId does not conform to the "greaterThan0" format');
        return done(null);
      })
      .catch(done);
  });
  afterEach((done) => {
    request(server)
      .del(`/companies/${company.id}`)
      .expect(204)
      .then(() => {
        company = null;
        return done(null);
      })
      .catch(done);
  });
  after((done) => {
    request(server)
      .del(`/locations/${location.id}`)
      .expect(204)
      .then(() => {
        location = null;
        return fs.unlinkAsync(config.DATABASE);
      })
      .then(() => done(null))
      .catch(done);
  });
});
