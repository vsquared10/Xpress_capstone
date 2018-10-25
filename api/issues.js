const express = require('express');
const issuesRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (error, row) => {
    if(error) {
      next(error);
    }
    row ? next() : res.sendStatus(404);
  });
});

issuesRouter.get('/', (req, res, next) => {
  const seriesId = req.params.seriesId;
  db.all(`SELECT * FROM Issue WHERE series_id = $seriesId`, {$seriesId: seriesId}, (error, rows) => {
    error ? next(error) : res.status(200).json({ issues: rows });
  });
});

issuesRouter.post('/', (req, res, next) => {
  const iss = req.body.issue;
  const name = iss.name;
  const issueNumber = iss.issueNumber;
  const pubDate = iss.publicationDate;
  const artistId = iss.artistId;
  const seriesId = req.params.seriesId;
  if(!name || !issueNumber || !pubDate || !artistId) {
    res.sendStatus(400);
  } else {
    const sql = `INSERT INTO Issue (name, issue_number, publication_date,
                 artist_id, series_id) VALUES ($name, $issueNumber, $pubDate,
                 $artistId, $seriesId)`;
    const vals = {
      $name: name,
      $issueNumber: issueNumber,
      $pubDate: pubDate,
      $artistId: artistId,
      $seriesId: seriesId
    };
    db.run(sql ,vals, function(error) {
      if(error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Issues WHERE id = ${this.lastID}`, (error, row) => {
          error ? next(error) : res.status(201).json({ issue: row });
        });
      };
    });
  };
});

issuesRouter.put('/:issueId', (req, res, next) => {
  const iss = req.body.issue;
  const name = iss.name;
  const issueNumber = iss.issueNumber;
  const pubDate = iss.publicationDate;
  const artistId = iss.artistId;
  const issueId = req.params.issueId;
  // const seriesId = req.params.seriesId;
  if(!name || !issueNumber || !pubDate || !artistId) {
    res.sendStatus(400);
  };
  db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (error, row) => {
    if(error) {
      next(error);
    };
    row ? next() : res.sendStatus(400);
  });
  const sql = `UPDATE Issue SET name = $name, issue_number = $issueNumber,
               publication_date = $pubDate, artist_id = $artistId,
               series_id = $seriesId
               WHERE id = $id`;
  const vals = {$name: name,
                $issueNumber: issueNumber,
                $pubDate: pubDate,
                $artistId: artistId,
                $id: issueId};
  db.run(sql ,vals, function(error) {
    if(error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (error, row) => {
        error ? next(error) : res.status(200).json({ series: row });
      });
    };
  });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`, function(error) {
    error ? next(error) : res.sendStatus(204);
  });
});

module.exports = issuesRouter;
