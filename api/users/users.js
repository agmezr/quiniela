const express = require('express'),
      router = express.Router(),
      pool = require('../controllers/database'),
      //sessionController = require('../controllers/session'),
      { positionHidden } = require('../config'),
      moment = require('moment'),
      updatePositions = require('../controllers/positions');

const predictions_by_user = "SELECT p.id_match, p.local, p.away,t1.name as local_name, t2.name as away_name, \
    t1.id as local_id, t2.id as away_id, m.start_date \
    FROM predictions p JOIN matches m ON p.id_match = m.id JOIN teams t1 ON m.local = t1.id \
    JOIN teams t2 ON  m.away = t2.id WHERE id_user = $1 ORDER BY m.start_date;"

// return an ordered list with the position of all users
router.get("/positions", function(req, res){
  pool.connect()
    .then(client => {
      return client.query('SELECT id, name, points FROM users ORDER BY points DESC, name')
        .then(data => {
          client.release();
          let positions = [];
          if (positionHidden) {
            if (!req.session) return res.status(404).json({status:"error", msg:"No session"});

            let uid = req.session.uid;
            for (let key in data.rows){
              let pos = data.rows[key];
              pos.name = pos.id == uid ? pos["name"] : "********";
              positions.push(pos);
            }
          }else{
            positions = data.rows;
          }
          res.status(200).json(positions);
        })
        .catch(err => {
          client.release();
          console.log(err.stack);
          res.status(404).json({status:"error"});
        });
    })
    .catch(e => {
      console.log("Error " + e);
      res.status(404).json({status:"error"});
    });
});

//update the position of all users
router.get("/positions/update", (req, res) =>{
  updatePositions();
  res.status(200).json({status:"ok", msg:"positions updated"});
});

// let a logged user to update his prediction if the match has not started
router.get("/prediction/:id/:match/:local/:away", (req, res) => {
  let id = req.params.id,
      match = req.params.match,
      local = req.params.local,
      expired = false,
      client = null,
      away = req.params.away;

  if (!req.session){
    return res.status(403).json({status:"error", msg:"No session"});
  }

  if (req.session.uid != id){
    console.log("Trying to update session of a diff user");
    return res.status(403).json({status:"error", msg:"Trying to update another user"});
  }

  pool.connect()
    .then(_client => {
      client = _client;
      let now = moment();
      return client.query("SELECT * FROM matches WHERE id = $1 and start_date > $2", [match, now]);
    })
    .then(data => {
      if (data.rowCount === 0) {
        console.log("Match expired");
        client.release();
        expired = true;
        return Promise.reject("Match expired");
      }
      return client.query("SELECT * FROM predictions WHERE id_user = $1 AND id_match = $2", [id, match]);
    })
    .then(data => {
      let query = '';
      if (data["rowCount"] > 0) {
        query = "UPDATE predictions SET local = $3, away = $4 WHERE id_user = $1 AND id_match = $2";
      }else{
        query = "INSERT INTO predictions(id_user, id_match, local, away) \
        VALUES($1, $2, $3, $4)";
      }
      return client.query(query,[id, match, local, away]);
    })
    .then(data => {
      client.release();
      res.status(200).json({status:"ok", id:data.id});
    })
    .catch(err => {
      if (expired){
        console.error(err);
        res.status(403).json({status:"Match expired"});
      }else{
        console.error(err.stack);
        res.status(500).json({status: "error"});
      }
    });
});

// No render for first version
/*
router.get("/predictions/all", (req, res) =>{
  var now = moment();
  pool.connect()
    .then(client => {
      return client.query(predictions_by_user, [req.session.uid])
        .then(data => {
          client.release();
          let predictions = data.rows;
          for (let key in predictions){
            predictions[key].valid = predictions[key].start_date > now;
          }
          return res.status(200).render('predictions_list', {predictions:predictions});
        })
        .catch(err => {
          client.release();
          console.log(err.stack);
        });
    })
    .catch(e => {
      console.log("Error" + e);
    });
});
*/
module.exports = router;
