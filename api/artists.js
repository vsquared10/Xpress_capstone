const express = require('express');
const artistRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistRouter.param('artistId', (req, res, next, artistId) => {
  db.get('SELECT * FROM Artist WHERE id = $id',
   { $id: artistId },
   (error, row) => {
     if(error) {
       next(error);
     } else if(row) {
       req.artist = row;
       next();
     } else {
       res.sendStatus(404);
     };
   });
});

artistRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (error, rows) => {
    if(error) {
      next(error);
    } else {
      res.status(200).json({artists: rows});
    };
  });
});

artistRouter.get('/:artistId', (req, res, next) => {
  res.status(200).json({ artist: req.artist });
});

artistRouter.post('/', (req, res, next) => {
  const name = req.body.artist.name;
  const DoB = req.body.artist.dateOfBirth;
  const bio = req.body.artist.biography;
  const emp = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!name || !DoB || !bio) {
    res.sendStatus(400);
  } else {
    const sql = `INSERT INTO Artist (name, date_of_birth, biography,
       is_currently_employed) VALUES ($name, $dateOfBirth, $biography,
       $isCurrentlyEmployed)`;
    const values = {$name: name,
                    $dateOfBirth: DoB,
                    $biography: bio,
                    $isCurrentlyEmployed: emp};
    db.run(sql, values, function(error) {
      if(error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`, (error, row) => {
            error ? next(error) : res.status(201).json({artist: row});
        });
      };
    });
  };
});

artistRouter.put('/:artistId', (req, res, next) => {
  const name = req.body.artist.name;
  const DoB = req.body.artist.dateOfBirth;
  const bio = req.body.artist.biography;
  const emp = req.body.artist.isCurrentlyEmployed;
  const artistId = req.params.artistId;
  if (!name || !DoB || !bio) {
    res.sendStatus(400);
  } else {
    const sql = `UPDATE Artist SET name = $name, date_of_birth = $DoB,
                 biography = $bio, is_currently_employed = $emp
                 WHERE id = $id`;
    const values = {$name: name,
                    $DoB: DoB,
                    $bio: bio,
                    $emp: emp,
                    $id: artistId};
    db.run(sql, values, (error) => {
      if(error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (error, row) => {
          if(error){
            next(error);
          }
          res.status(200).json({artist: row});
        });
      };
    });
  };
});

artistRouter.delete('/:artistId', (req, res, next) => {
  const artistId = req.params.artistId;
  db.run(`UPDATE Artist SET is_currently_employed = 0
          WHERE id = $id`, {$id: artistId}, (error) => {
            if(error) {
              next(error);
            } else {
              db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (error, row) => {
                if(error) {
                  next(error);
                };
                res.status(200).json({artist: row});
              });
            };
  });
});

module.exports = artistRouter;
