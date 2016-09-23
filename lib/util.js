const uuid = require('node-uuid');
const moment = require('moment');

const util = exports;

util.getUuid = function getUuid() {
  return uuid.v4();
};
util.getCurrentDate = function getCurrentDate() {
  return moment().format();
};
