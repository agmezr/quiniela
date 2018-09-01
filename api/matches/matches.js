/**
 * This file contains all the operations related to matches, like
 * showing results, next match, show the predicitons of all users
 * of the match, etc
 */
const express = require('express'),
      router = express.Router(),
      pool = require('../controllers/database'),
      { positionHidden } = require('../config'),
      moment = require('moment');

// query to get all matches with results
const matchesQuery = "SELECT m.id, m.local, t1.name as local_name, m.away, \
 t2.name as away_name, m.local_goals, m.away_goals, m.start_date \
 FROM matches m \
 JOIN teams as t1 ON m.local = t1.id \
 JOIN teams as t2 ON m.away = t2.id";

const predictionsByMatch = "SELECT u.id, u.name, u.points, p.local, p.away \
                               FROM predictions p \
                               JOIN users u ON p.id_user = u.id \
                               WHERE id_match = $1 ORDER BY u.points DESC, u.name;"

const timeFormat = 'YYYY-MM-DD HH:mm:ss';

// the max number of matches shown in next
const limit = 5;

router.get("/all", (req, res) => {
  console.log("obtain all matches");
  pool.connect()
    .then(client => {
      return client.query(`${matchesQuery} ORDER BY start_date`)
        .then(data => {
          client.release();
          console.log(data.rows);
          res.json(data.rows);
        })
        .catch(err => {
          client.release();
          console.error(err.stack);
          res.status(404).json({status:"Error"});
        });
    })
    .catch(e =>{
      console.log("Error" + e);
      res.status(404).json({status:"Error"});
    });
});

router.get("/next", (req, res) => {
    //var now = moment.utc(moment.now()).format(timeFormat);
    var now = moment();
    console.log(`matches after ${now}`);
    pool.connect()
      .then(client => {
        return client.query(`${matchesQuery} WHERE start_date > $1 ORDER BY start_date LIMIT ${limit};`, [now])
          .then(data => {
            client.release();
            res.json(data.rows);
          })
          .catch(err => {
            client.release();
            console.log(err.stack);
            res.status(404).json({status:"Error"});
          });
      })
      .catch(e => {
        console.log("Error" + e);
        res.status(404).json({status:"Error"});
      });
});

router.get("/past", (req, res) => {
    var now = moment();
    console.log(`matches before ${now}`);
    pool.connect()
      .then(client => {
        let pastLimit = limit - 1;
        return client.query(`${matchesQuery} WHERE start_date < $1 ORDER BY start_date DESC LIMIT ${pastLimit};`, [now])
          .then(data => {
            client.release();
            res.json(data.rows);
          })
          .catch(err => {
            client.release();
            console.log(err.stack);
            res.status(404).json({status:"Error"});
          });
      })
      .catch(e => {
        console.log("Error" + e);
        res.status(404).json({status:"Error"});
      });
});

router.get("/update/:id/:local/:away", (req, res) => {
  var local_goals = req.params.local;
  var away_goals = req.params.away;
  var matchId = req.params.id;
  console.log(`updating for ${local_goals} and ${away_goals}`);
  pool.connect()
    .then(client => {
      return client.query(`UPDATE matches SET local_goals = $1, away_goals = $2 WHERE id = $3;`, [local_goals, away_goals, matchId])
        .then(data => {
          client.release();
          console.log(data);
          if(data["rowCount"] > 0){
            res.status(200).json({status:"ok"});
          }else{
            res.status(400).json({status:"error", msg:"Could not update"});
          }
        })
        .catch(err => {
          client.release();
          console.log(err.stack);
          res.status(404).json({status:"Error"});
        })
    })
    .catch(e => {
      console.log(`Error on update ${e}`);
      res.status(404).json({status:"Error"});
    });

});

router.get("/:id", (req, res) => {
  pool.connect()
  .then(client => {
    return client.query(`${matchesQuery} WHERE m.id = $1 LIMIT 1`, [req.params.id] )
      .then(data => {
        client.release();
        res.json({match: data.rows[0]});
      })
      .catch(err => {
        client.release();
        console.log(err.stack);
        res.status(404).json({status:"Error"});
      });
  })
  .catch(e => {
    try{
      client.release();
    }catch(error){
      console.error(error);
    }
    console.log("Error" + e);
    res.status(404).json({status:"Error"});
  });
});

// Note: This next endpoint are for rendering the views. The first version only
// contains the api so no views are created yet
// retrieve all the predicitons of the user logged in
/*
router.get("/prediction/:match", (req, res) => {
  pool.connect()
    .then(client => {
      return client.query(`SELECT * FROM matches WHERE id = $1 LIMIT 1;`, [req.params.match])
        .then(data => {
          let match = data.rows[0];
          let uid = req.session.uid || 1; // this is used if there is no session
          return client.query('SELECT * FROM predictions WHERE id_user = $1 AND id_match = $2 LIMIT 1;', [req.session.uid, req.params.match])
            .then(data => {
              client.release();
              let prediction = data.rows.length > 0 ? data.rows[0] : {local: 0, away: 0};
              let now = moment();
              let startDate = match.start_date;
              let utcTime = moment.utc(startDate, timeFormat).valueOf();
              let matchDate = moment(utcTime);
              if (now > matchDate){
                console.log("Match already started or finished");
                return res.redirect('/');
              }
              res.status(200).render('prediction', {current:match.id, uid: req.session.uid, local:prediction.local, away:prediction.away});
            })
            .catch(err => {
              try{
                client.release();
              }catch(error){
                console.error("Client already released");
              }
              console.error(err.stack);
            });

        })
        .catch(err => {
          try{
            client.release();
          }catch(error){
            console.error("Client already released");
          }
          console.log(err.stack);
        });
    })
    .catch(e => {
      console.log(e.stack);
      console.error(`Error on /prediction searching match ${e}`);
    });
});

router.get('/predictions/history/:id', (req, res) => {
  let client = null;
  let now = moment();
  let valid = false;
  let match = null;
  pool.connect()
  .then(_client => {
    client = _client;
    return client.query(`${matchesQuery} WHERE m.id = $1`, [req.params.id]);
  })
  .then(matchData =>{
    match = matchData.rows[0];
    if (match.start_date > now){
      expired = true;
      throw new Error("Match has not started");
    }
    return client.query(predictionsByMatch, [match.id]);
  })
  .then(data => {
    client.release();
    let predictions = [];
    if (positionHidden) {
      let uid = req.session.uid;
      for (let key in data.rows){
        let prediction = data.rows[key];
        prediction.name = prediction.id == uid ? prediction["name"] : "********";
        predictions.push(prediction);
      }
    }else{
      predictions = data.rows;
    }
    res.status(200).render('all_predictions', {match:match, predictions:predictions});
  })
  .catch(e =>{
    try{
      client.release();
    }catch(error){
      console.error(error);
    }

    if (valid){
      res.status(403).json({status:"Match not valid"});
    }else{
      console.error(e);
      res.status(500).json({status:"error"});
    }
  })
})

router.get('/history', (req, res) => {
  let client = null;
  let now = moment();
  pool.connect()
  .then(_client => {
    client = _client;
    console.log("searching for matches");
    return client.query(` ${matchesQuery} WHERE m.start_date < $1 ORDER BY start_date;`, [now]);
  })
  .then(data => {
    console.log(data.rows);
    client.release();
    res.status(200).render('matches_history', {matches:data.rows});
  })
  .catch(e => {
    try{
      client.release();
    }catch(error){
      console.error(error);
    }
    console.error(e);
  })
});
*/

module.exports = router;
