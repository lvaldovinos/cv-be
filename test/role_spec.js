'use strict';

const should = require('should');
const request = require('supertest');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const { connectionFactory, schemaBuilder } = require('cv-core');
const server = require('../server');
const winston = require('winston');
const config = require('../config');

let role = {};

describe('role test suite', () => {
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
    role = {
      name: 'Development',
      color: '#FFFFFF',
    };
    request(server)
      .post('/roles')
      .send(role)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((response) => {
        const { body } = response;
        const { data } = body;
        should(data.id).be.a.Number();
        should(data.id > 0).be.exactly(true);
        role.id = data.id;
        return done(null);
      })
      .catch(done);
  });
  it('get all roles', (done) => {
    request(server)
      .get('/roles')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        const { data: roles } = body;
        should(roles).be.an.Array();
        should(roles).have.length(1);
        should(roles[0]).have.properties([
          'name',
          'id',
          'color',
        ]);
        should(roles[0].name).be.exactly('Development');
        should(roles[0].color).be.exactly('#FFFFFF');
        should(roles[0].id).be.exactly(role.id);
        return done(null);
      })
      .catch(done);
  });
  it('remove role by id not resource found', (done) => {
    request(server)
      .del('/roles/0')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(({ body }) => {
        const { data } = body;
        should(data).be.exactly('Role resource not found');
        return done(null);
      })
      .catch(done);
  });
  it('update role', (done) => {
    request(server)
      .put(`/roles/${role.id}`)
      .send({
        name: 'Backend',
        color: '#FFFFFE',
      })
      .expect(204)
      .then(() => request(server)
        .get('/roles')
        .expect(200))
      .then(({ body }) => {
        const { data: roles } = body;
        should(roles).be.an.Array();
        should(roles).have.length(1);
        should(roles[0]).have.properties([
          'name',
          'id',
          'color',
        ]);
        should(roles[0].name).be.exactly('Backend');
        should(roles[0].color).be.exactly('#FFFFFE');
        should(roles[0].id).be.exactly(role.id);
        return done(null);
      })
      .catch(done);
  });
  it('create role - throw 500 if invalid paylod', (done) => {
    request(server)
      .post('/roles')
      .send({
        name: 'Backend',
        color: 'FFFFFE',
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('role.color does not conform to the "hexColor" format');
        return done(null);
      })
      .catch(done);
  });
  it('update role - throw 500 if invalid payload', (done) => {
    request(server)
      .put(`/roles/${role.id}`)
      .send({
        color: '#FFFFFE',
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('role requires property "name"');
        return done(null);
      })
      .catch(done);
  });
  afterEach((done) => {
    request(server)
      .del(`/roles/${role.id}`)
      .expect(204)
      .then(() => {
        role = null;
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
