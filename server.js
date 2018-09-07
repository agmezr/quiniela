/**
 * Configuration and router for app 
 */

const express = require('express'),
    app = express(),
    matches = require('./api/matches'),
    teams = require('./api/teams'),
    users = require('./api/users'),
    helmet = require('helmet');

const PORT = process.env.PORT || 8080;
const PROD = process.env.NODE_ENV === "production" || false;

if (PROD){
  // using helmet when env is in production
  app.use(helmet());
  console.log("Added helmet headers");
}

app.use("/teams",teams)
.use('/matches', matches)
.use('/users', users)
.use('/index', (req, res, next) => {
  res.status(200).json({status:"ok"});
})
.use((req, res, next) => {
  res.status(404).json({status:"error", msg:"Page cannot be found!"});
});

app.listen(PORT);
console.log(`Staring app on ${PORT}`);
