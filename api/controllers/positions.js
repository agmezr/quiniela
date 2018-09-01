const pool = require('./database');


matchWinner = (local, away) => {
  if (local < 0 || away < 0) {
    return "error";
  }
  let result;
  if (local > away){
    result = "local";
  }else if (local < away) {
    result = "away";
  }else{
    result = "tie";
  }
  return result;
}

// function used to update points for all users
module.exports = updatePositions = async() => {
  var client =  await pool.connect();
  let data = await client.query("SELECT id, name FROM users;");
  var users = data.rows;
  for (let key in users){
    var user = users[key];
    let total = 0;
    console.log(user);
    let data = await client.query("SELECT p.local, p.away, m.local_goals, m.away_goals \
      FROM predictions p JOIN matches m ON p.id_match = m.id WHERE id_user = $1 ", [user.id]);
    var predictions = data.rows;
    for (let key in predictions){
      var prediction = predictions[key];
      console.log(prediction);
      if(prediction.local_goals < 0 || prediction.away_goals < 0 ){
        console.log("match without score");
        continue;
      }
      if (prediction.local == prediction.local_goals && prediction.away == prediction.away_goals){
        console.log("Exact match ");
        total += 3;
      }else {
        var predictionWinner = matchWinner(prediction.local, prediction.away);
        var realWinner = matchWinner(prediction.local_goals, prediction.away_goals);
        console.log(`Prediction : ${predictionWinner}, Real: ${realWinner}`);
        total += (predictionWinner === realWinner);
      }
      console.log(total);
    }
    client.query("UPDATE users SET points = $1 WHERE id = $2", [total, user.id])
    .then(data => {
      // console.log(data);
      console.log("data updated");
    })
    .catch(error => {
      console.error("Error on update positions " + error)
    });
  };
}
