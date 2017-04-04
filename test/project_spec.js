'use strict';

const should = require('should');
const request = require('supertest');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const { connectionFactory, schemaBuilder } = require('cv-core');
const server = require('../server');
const winston = require('winston');
const config = require('../config');

const locations = {};
const companies = {};
let project = {};

describe('project test suite', () => {
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
      locations.gdl = {
        city: 'Gudalajara',
        country: 'MEX',
      };
      locations.boston = {
        city: 'Boston',
        country: 'USA',
      };
      return request(server)
        .post('/locations')
        .send(locations.gdl)
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }) => {
          const { data } = body;
          locations.gdl.id = data.id;
          return request(server)
            .post('/locations')
            .send(locations.boston)
            .expect('Content-Type', /json/)
            .expect(201);
        })
        .then(({ body }) => {
          const { data } = body;
          locations.boston.id = data.id;
          return Promise.resolve();
        });
    })
    .then(() => {
      companies.unosquare = {
        name: 'unosquare',
        webpage: 'https://www.unosquare.com',
        imageUrl: 'https://www.unosquare.com/images/logo_178.png',
        locationId: locations.gdl.id,
      };
      companies.fmi = {
        name: 'foundation medicine',
        webpage: 'http://www.foundationmedicine.com',
        imageUrl: 'http://www.foundationmedicine.com/wp-content/themes/foundationmedicine/img/logos/foundation-medicine-2x.png',
        locationId: locations.boston.id,
      };
      return request(server)
        .post('/companies')
        .send(companies.unosquare)
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }) => {
          const { data } = body;
          companies.unosquare.id = data.id;
          return request(server)
            .post('/companies')
            .send(companies.fmi)
            .expect('Content-Type', /json/)
            .expect(201);
        })
        .then(({ body }) => {
          const { data } = body;
          companies.fmi.id = data.id;
          return done(null);
        });
    })
    .catch(done);
  });
  beforeEach((done) => {
    project = {
      name: 'bluejay',
      startDate: 'Aug 2015',
      highlight: 'a great project',
      clientId: companies.fmi.id,
      vendorId: companies.unosquare.id,
    };
    request(server)
      .post('/projects')
      .send(project)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((response) => {
        const { body } = response;
        const { data } = body;
        should(data.id).be.a.Number();
        should(data.id > 0).be.exactly(true);
        project.id = data.id;
        return done(null);
      })
      .catch(done);
  });
  it('get all projects', (done) => {
    request(server)
      .get('/projects')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }) => {
        const { data: projects } = body;
        should(projects).be.an.Array();
        should(projects).have.length(1);
        should(projects[0]).have.properties([
          'name',
          'id',
          'startDate',
          'endDate',
          'highlight',
          'clientId',
          'vendorId',
        ]);
        should(projects[0].id).be.exactly(project.id);
        should(projects[0].name).be.exactly('bluejay');
        should(projects[0].startDate).be.exactly('Aug 2015');
        should(projects[0].endDate).be.exactly(null);
        should(projects[0].highlight).be.exactly('a great project');
        should(projects[0].clientId).be.exactly(companies.fmi.id);
        should(projects[0].vendorId).be.exactly(companies.unosquare.id);
        return done(null);
      })
      .catch(done);
  });
  it('remove project by id not resource found', (done) => {
    request(server)
      .del('/projects/0')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(({ body }) => {
        const { data } = body;
        should(data).be.exactly('Project resource not found');
        return done(null);
      })
      .catch(done);
  });
  it('update project', (done) => {
    request(server)
      .put(`/projects/${project.id}`)
      .send({
        name: 'bluejayUpdate',
        startDate: 'Aug 2016',
        endDate: 'Mar 2017',
        highlight: 'a great project update',
        clientId: companies.unosquare.id,
        vendorId: companies.fmi.id,
      })
      .expect(204)
      .then(() => request(server)
        .get('/projects')
        .expect(200))
      .then(({ body }) => {
        const { data: projects } = body;
        should(projects).be.an.Array();
        should(projects).have.length(1);
        should(projects[0]).have.properties([
          'name',
          'id',
          'startDate',
          'endDate',
          'highlight',
          'clientId',
          'vendorId',
        ]);
        should(projects[0].id).be.exactly(project.id);
        should(projects[0].name).be.exactly('bluejayUpdate');
        should(projects[0].startDate).be.exactly('Aug 2016');
        should(projects[0].endDate).be.exactly('Mar 2017');
        should(projects[0].highlight).be.exactly('a great project update');
        should(projects[0].clientId).be.exactly(companies.unosquare.id);
        should(projects[0].vendorId).be.exactly(companies.fmi.id);
        return done(null);
      })
      .catch(done);
  });
  describe('add/remove roles to project', () => {
    let role = {};
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
    it('add/remove role to project', (done) => {
      request(server)
        .post(`/projects/${project.id}/roles`)
        .send({
          roleId: role.id,
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .then(() => request(server)
          .get(`/projects/${project.id}/roles`)
          .expect('Content-Type', /json/)
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
          should(roles[0].name).be.exactly('Development');
          should(roles[0].color).be.exactly('#FFFFFF');
          should(roles[0].id).be.exactly(role.id);
          return request(server)
            .del(`/projects/${project.id}/roles/${role.id}`)
            .expect(204);
        })
        .then(() => request(server)
          .get(`/projects/${project.id}/roles`)
          .expect('Content-Type', /json/)
          .expect(200))
        .then(({ body }) => {
          const { data: roles } = body;
          should(roles).be.an.Array();
          should(roles).be.empty();
          return done(null);
        })
        .catch(done);
    });
    it('add role - throw 500 error if invalid payload', (done) => {
      request(server)
        .post(`/projects/${project.id}/roles`)
        .send({
          roleId: 0,
        })
        .expect('Content-Type', /json/)
        .expect(500)
        .then((response) => {
          const { body } = response;
          const { message: error } = body;
          should(error).be.a.Object();
          should(error.code).be.exactly('InvalidPayloadError');
          should(error.message).be.exactly('projectRole.roleId does not conform to the "greaterThan0" format');
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
  });
  describe('add/remove tools to project', () => {
    let tool = {};
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
    it('add/remove tool to project', (done) => {
      request(server)
        .post(`/projects/${project.id}/tools`)
        .send({
          toolId: tool.id,
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .then(() => request(server)
          .get(`/projects/${project.id}/tools`)
          .expect('Content-Type', /json/)
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
          should(tools[0].name).be.exactly('node');
          should(tools[0].webpage).be.exactly('https://nodejs.org/en');
          should(tools[0].id).be.exactly(tool.id);
          return request(server)
            .del(`/projects/${project.id}/tools/${tool.id}`)
            .expect(204);
        })
        .then(() => request(server)
          .get(`/projects/${project.id}/tools`)
          .expect('Content-Type', /json/)
          .expect(200))
        .then(({ body }) => {
          const { data: tools } = body;
          should(tools).be.an.Array();
          should(tools).be.empty();
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
  });
  it('create project - throw 500 if invalid paylod', (done) => {
    request(server)
      .post('/projects')
      .send({
        name: 'bluejay',
        startDate: '10-30-2015',
        highlight: 'a great project',
        clientId: companies.fmi.id,
        vendorId: companies.unosquare.id,
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('project.startDate does not conform to the "monthYear" format');
        return done(null);
      })
      .catch(done);
  });
  it('update project - throw 500 if invalid payload', (done) => {
    request(server)
      .put(`/projects/${project.id}`)
      .send({
        name: 'bluejay',
        startDate: 'Aug 2015',
        endDate: 'Mar 2017',
        highlight: 'a great project',
        clientId: 0,
        vendorId: 0,
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('project.clientId does not conform to the "greaterThan0" format, project.vendorId does not conform to the "greaterThan0" format');
        return done(null);
      })
      .catch(done);
  });
  it('add tool - throw 500 error if invalid payload', (done) => {
    request(server)
      .post(`/projects/${project.id}/tools`)
      .send({
        toolId: 0,
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response) => {
        const { body } = response;
        const { message: error } = body;
        should(error).be.a.Object();
        should(error.code).be.exactly('InvalidPayloadError');
        should(error.message).be.exactly('projectTool.toolId does not conform to the "greaterThan0" format');
        return done(null);
      })
      .catch(done);
  });
  afterEach((done) => {
    request(server)
      .del(`/projects/${project.id}`)
      .expect(204)
      .then(() => {
        project = null;
        return done(null);
      })
      .catch(done);
  });
  after((done) => {
    request(server)
      .del(`/companies/${companies.unosquare.id}`)
      .expect(204)
      .then(() => request(server)
        .del(`/companies/${companies.fmi.id}`)
        .expect(204))
      .then(() => {
        companies.unosquare = null;
        companies.fmi = null;
        return request(server)
          .del(`/locations/${locations.gdl.id}`)
          .expect(204);
      })
      .then(() => request(server)
        .del(`/locations/${locations.boston.id}`)
        .expect(204))
      .then(() => {
        locations.gdl = null;
        locations.boston = null;
        return fs.unlinkAsync(config.DATABASE);
      })
      .then(() => done(null))
      .catch(done);
  });
});
