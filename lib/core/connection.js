const request = require('request');
const url = require('url');
const EventEmitter = require('events');

class Connection extends EventEmitter {
  constructor(opts) {
    super();
    this.connectionUrl = null;
    this.connected = false;
    process.nextTick(() => {
      request({
        url: `http://${opts.server}:${opts.port}/${opts.db}`,
        json: true,
      }, (err, res, body) => {
        if (err) return this.emit('error', err);
        // no error this means we can interact
        // with the couchdb server
        // validate valid couchdb response
        if (body.reason && body.reason === 'no_db_file') {
          return this.emit('error', {
            code: 'NOTEXISTS',
            message: 'Database does not exist',
          });
        }
        this.connectionUrl = url.parse(`http://${opts.server}:${opts.port}/${opts.db}`);
        this.connected = body.db_name === opts.db;
        return this.emit('connect');
      });
    });
  }
  getConnectionUrl() {
    if (!this.connected) return null;
    return url.format(this.connectionUrl);
  }
  destroy() {
    this.connectionUrl = null;
    this.connected = false;
  }
}

module.exports = Connection;
