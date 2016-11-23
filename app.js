var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var postgres = require('./lib/postgres');

var app = express();

app.use(express.static('public'));

app.use(bodyParser.json({ type: 'application/json' }));
app.use(validator());

var inventoryRouter = express.Router();

function error(err, res, code, msg) {
  console.error(err);
  return res.status(code).json({ errors: [ msg ] });
}

function validateInventory(req, res, next) {
  if(req.body.sku || req.body.sku == "") {
    req.checkBody('sku', 'Invalid sku').notEmpty().isInt();
  }
  if(req.body.name || req.body.name == "") {
    req.checkBody('name', 'Invalid name').notEmpty();
  }
  if(req.body.description || req.body.description == "") {
    req.checkBody('description', 'Invalid description').notEmpty();
  }
  if(req.body.price || req.body.price == "") {
    req.checkBody('price', 'Invalid price').notEmpty().isFloat();
  }
  if(req.body.stock || req.body.stock == "") {
    req.checkBody('stock', 'Invalid stock').notEmpty().isInt();
  }

  var errors = req.validationErrors();
  if(errors) {
    var msg = { errors: [] };
    errors.forEach(function(err) {
      msg.errors.push(err.msg);
    });
    return res.status(400).json(msg);
  }
  next();
}

function lookupInventory(req, res, next) {
  postgres.pool.query('SELECT * FROM inventory WHERE id = $1', [ req.params.id ], function(err, result) {
    if(err) {
      return error(err, res, code, 'Failed to retrieve inventory');
    }
    if(result.rows.length === 0) {
      return res.status(404).json({ errors: ['Inventory not found'] });
    }
    req.inventory = result.rows[0];
    next();
  });
}

inventoryRouter.get('/', function(req, res) {
  var page = parseInt(req.query.page, 10);
  if(isNaN(page) || poage < 1){
    page = 1;
  }

  var limit = parseInt(req.query.limit, 10);
  if(isNaN(limit)) {
    limit = 10;
  } else if(limit > 50) {
    limit = 50;
  } else if(limit < 1) {
    limit = 1;
  }

  postgres.pool.connect(function(err, client, done) {
    client.query('SELECT count(1) FROM inventory', function(err, result) {
      if(err) {
        return error(err, res, 500, 'Failed to retrive inventory');
      }
      var count = parseInt(result.rows[0].count, 10);
      var offset = (page - 1) * limit;

      client.query('SELECT * FROM inventory OFFSET $1 LIMIT $2', [ offset, limit ], function(err, results) {
        done();
        if(err) {
          return error(err, res, 500, 'Failed to retrive inventory');
        }
        if(results.rows.length === 0) {
          return res.status(404).json({ errors: ['Inventory not found'] });
        }
        res.json(results.rows);
      });
    });
  });
});

inventoryRouter.post('/', validateInventory, function(req, res) {
  var data = [
    req.body.sku,
    req.body.brand,
    req.body.name,
    req.body.description,
    req.body.price,
    req.body.stock,
    req.body.category
  ];
  postgres.pool.connect(function(err, client, done) {
    if(err) {
      return error(err, res, 500, 'Failed to insert inventory');
    }
    client.query('INSERT INTO inventory (sku, brand, name, description, price, stock, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', data, function(err, result) {
      if(err) {
        return error(err, res, 500, 'Failed to insert inventory');
      }
      client.query('SELECT * FROM inventory WHERE id = $1', [ result.rows[0].id ], function(err, results) {
        done();
        if(err) {
          return error(err, res, 500, 'Failed to retrieve inventory after insert');
        }
        return res.status(201).json(results.rows[0]);
      });
    });
  });
});

inventoryRouter.get('/:id([0-9]+)', lookupInventory, function(req, res) {
  return res.json(req.inventory);
});

inventoryRouter.patch('/:id([0-9]+)', validateInventory, lookupInventory, function(req, res) {
  var columns = '';
  for(var key in req.body){
    columns += key + ' = \'' + req.body[key] + '\', ';
  }
  columns = columns.slice(0,-2);

  postgres.pool.connect(function(err, client, done) {
    if(err) {
      return error(err, res, 500, 'Failed to update inventory');
    }
    client.query('UPDATE inventory SET ' + columns + ' WHERE id = $1', [ req.params.id ], function(err, result) {
      if(err) {
        return error(err, res, 500, 'Failed to update inventory');
      }
      client.query('SELECT * FROM inventory WHERE id = $1', [ req.params.id ], function(err, results) {
        done();
        if(err) {
          return error(err, res, 500, 'Failed to retrieve inventory after update');
        }
        return res.status(201).json(results.rows[0]);
      });
    });
  });
});

inventoryRouter.delete('/:id([0-9]+)', lookupInventory, function(req, res) {
  postgres.pool.query('DELETE FROM inventory WHERE id = $1', [ req.params.id ], function(err, result) {
    if(err) {
      return error(err, res, 500, 'Failed to delete inventory');
    }
    return res.json({ success: ['Inventory was deleted'] });
  });
});

app.use('/inventory', inventoryRouter);

app.use('/inventory', function(err, req, res, next) {
  res.status(err.statusCode).json({ errors: [ err.body + " - " + err.message ] });
});

app.use(function(req, res, next) {
  res.status(404).redirect('/#' + req.originalUrl);
});

module.exports = app;
