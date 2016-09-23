const is = require('../lib/is');
const should = require('should');
const moment = require('moment');

describe('lib/is.js test suite', () => {
  it('Should return true if parameter is indeed an object', () => {
    should(is.object(() => {})).be.exactly(true);
    should(is.object({})).be.exactly(true);
  });
  it('Should return false if parameter is not an object', () => {
    should(is.object('string')).be.exactly(false);
  });
  it('Should return true if parameter is a string', () => {
    should(is.string('123')).be.exactly(true);
  });
  it('Should return false if parameter is not a string', () => {
    should(is.string(123)).be.exactly(false);
  });
  it('Should return true if string is a date', () => {
    should(is.date(moment().format())).be.exactly(true);
  });
  it('Should return false if string date parameter is not a string', () => {
    should(is.date(123)).be.exactly(false);
  });
  it('Should return false if string is not a date', () => {
    should(is.date('qewr')).be.exactly(false);
  });
  it('Should return false if string is not a url', () => {
    should(is.url('hhtp://lakjdhf1234.324j')).be.exactly(false);
  });
  it('Should return false if string is not a string', () => {
    should(is.url(134)).be.exactly(false);
  });
  it('Should return true if string is indeed a url', () => {
    should(is.url('https://www.google.com.mx')).be.exactly(true);
  });
  it('Should return false if obj is not array', () => {
    should(is.array('asfd')).be.exactly(false);
  });
  it('Should return true if obj is indeed array', () => {
    should(is.array([])).be.exactly(true);
  });
});
