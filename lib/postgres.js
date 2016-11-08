var pg = exports; exports.constructor = function pg() {};

var Pool = require('pg').Pool;

pg.initialize = function(config, cb) {
  var pool = new Pool(config);

  pool.on('error', function(err, client) {
    console.error('Idle client error', err.message, err.stack);
  });

  pg.pool = pool;
  cb();
}
