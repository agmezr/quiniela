const { Pool } = require('pg');

const { DATABASE_URL } = process.env;

// if the url for the database is in process use that,
// usually when using heroku or similar to deploy
if (DATABASE_URL){
    console.log("Using database url");
    var pool = new Pool({
        connectionString: DATABASE_URL
    });
}else{
    console.log("Using database info");
    var pool = new Pool({
      user: 'quiniela_test',
      host: 'localhost',
      database: 'quiniela_test',
      password: 'my_password',
      port: 5432
    });
}

module.exports = pool;
