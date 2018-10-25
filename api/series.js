const express = require('express');
const seriesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const issuesRouter = require('./issues');

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  db.get(`SELECT * FROM Series WHERE id = ${seriesId}`, (error, row) => {
    if(error) {
      next(error);
    } else if(row) {
      req.series = row;
      next();
    } else {
      res.sendStatus(404);
    };
  });
});

seriesRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Series", (error, rows) => {
    error ? next(error) : res.status(200).json({ series: rows });
  });
});

seriesRouter.get('/:seriesId', (req, res, next) => {
  res.status(200).json({ series: req.series });
});

seriesRouter.post('/', (req, res, next) => {
  const ser = req.body.series;
  const name = ser.name;
  const desc = ser.description;
  if(!name || !desc) {
    res.sendStatus(400);
  } else {
    const sql = `INSERT INTO Series (name, description) VALUES ($name, $description)`;
    const vals = {$name: name, $description: desc};
    db.run(sql ,vals, function(error) {
      if(error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (error, row) => {
          error ? next(error) : res.status(201).json({ series: row });
        });
      };
    });
  };
});

seriesRouter.put('/:seriesId', (req, res, next) => {
  const ser = req.body.series;
  const name = ser.name;
  const desc = ser.description;
  const seriesId = req.params.seriesId;
  if(!name || !desc) {
    res.sendStatus(400);
  } else {
    const sql = `UPDATE Series SET name = $name, description = $description
                 WHERE id = $id`;
    const vals = {$name: name, $description: desc, $id: seriesId};
    db.run(sql, vals, (error) => {
      if(error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${seriesId}`, (error, row) => {
          error ? next(error) : res.status(200).json({ series: row });
        });
      };
    });
  };
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
  db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (error, row) => {
    if(error) {
      next(error);
    } else if(!row) {
      res.sendStatus(400);
    };
    db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`, (error) => {
        error ? next(error) : res.sendStatus(204);
    });
  });
});

module.exports = seriesRouter;
