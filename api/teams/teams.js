/**
 * This file contains all the operations related to teams.
 */
const express = require('express'),
    router = express.Router(),
    pool = require('../controllers/database');

router.get("/", function(req, res){
  console.log("obtain all teams");
  pool.connect()
    .then(client => {
      return client.query("SELECT * FROM teams")
        .then(data =>{
          client.release();
          console.log(data.rows);
          res.json(data.rows);
        })
        .catch(err =>{
          client.release();
          console.log(err.stack);
          res.status(404).json({status:"Error"});
        });
    })
    .catch(e =>{
      console.log("Error" + e);
      res.status(404).json({status:"Error"});
    });
});

router.get("/:id", (req, res) => {
  console.log(req.params.id);
  pool.connect()
  .then(client => {
    return client.query("SELECT * FROM teams WHERE teams.id = $1", [req.params.id] )
      .then(data =>{
        client.release();
        console.log(data.rows);
        res.json(data.rows);
      })
      .catch(err =>{
        client.release();
        console.log(err.stack);
        res.status(404).json({status:"Error"});
      });
  })
  .catch(e =>{
    console.log("Error" + e);
  });
});

module.exports = router
