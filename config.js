'use strict';

const config = Object.create(null, {
  DATABASE: {
    value: `${__dirname}/data.db`,
    enumerable: true,
    configurable: false,
    writable: false,
  },
  PORT: {
    value: 3000,
    enumerable: true,
    configurable: false,
    writable: false,
  },
});

module.exports = config;
