'use strict';

const should = require('should');
const request = require('supertest');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const { connectionFactory, schemaBuilder } = require('cv-core');
const server = require('../server');
const winston = require('winston');
const config = require('../config');

let tool = {};

describe('tool test suite', () => {
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
    tool = {
      name: 'node',
      webpage: 'https://nodejs.org/en',
    };
    request(server)
      .post('/tools')
      .send(tool)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((response) => {
        const { body } = response;
        const { data } = body;
        should(data.id).be.a.Number();
        should(data.id > 0).be.exactly(true);
        tool.id = data.id;
        return done(null);
      })
      .catch(done);
  });
  it('get all tools', (done) => {
    request(server)
      .get('/tools')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        const { data: tools } = body;
        should(tools).be.an.Array();
        should(tools).have.length(1);
        should(tools[0]).have.properties([
          'name',
          'id',
          'webpage',
        ]);
        should(tools[0].name).be.exactly('node');
        should(tools[0].webpage).be.exactly('https://nodejs.org/en');
        should(tools[0].id).be.exactly(tool.id);
        return done(null);
      })
      .catch(done);
  });
  it('remove tool by id not resource found', (done) => {
    request(server)
      .del('/tools/0')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(({ body }) => {
        const { data } = body;
        should(data).be.exactly('Tool resource not found');
        return done(null);
      })
      .catch(done);
  });
  it('update tool', (done) => {
    request(server)
      .put(`/tools/${tool.id}`)
      .send({
        name: 'nodeUpdate',
        webpage: 'https://nodejs.org/en/update',
      })
      .expect(204)
      .then(() => request(server)
        .get('/tools')
        .expect(200))
      .then(({ body }) => {
        const { data: tools } = body;
        should(tools).be.an.Array();
        should(tools).have.length(1);
        should(tools[0]).have.properties([
          'name',
          'id',
          'webpage',
        ]);
        should(tools[0].name).be.exactly('nodeUpdate');
        should(tools[0].webpage).be.exactly('https://nodejs.org/en/update');
        should(tools[0].id).be.exactly(tool.id);
        return done(null);
      })
      .catch(done);
  });
  it('create tool - throw 500 if invalid paylod', (done) => {
    request(server)
      .post('/tools')
      .send({
        name: 'nodeUpdate@#$',
        webpage: 'https://nodejs.org/en/update',
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('tool.name does not conform to the "alphanumeric" format');
        return done(null);
      })
      .catch(done);
  });
  it('update tool - throw 500 if invalid payload', (done) => {
    request(server)
      .put(`/tools/${tool.id}`)
      .send({
        name: 'nodeUpdate',
        webpage: 'https://nodejs.org/en/uq@#$pdate',
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('tool.webpage does not conform to the "url" format');
        return done(null);
      })
      .catch(done);
  });
  afterEach((done) => {
    request(server)
      .del(`/tools/${tool.id}`)
      .expect(204)
      .then(() => {
        tool = null;
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
