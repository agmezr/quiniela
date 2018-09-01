-- File to setup the database with some user and predictions tests
\c postgres

DROP DATABASE IF EXISTS quiniela_test;
CREATE DATABASE quiniela_test;

DROP ROLE IF EXISTS quiniela_test;
-- change the password for somethig secure
CREATE ROLE quiniela_test WITH PASSWORD 'my_password' LOGIN;

\c quiniela_test
SET ROLE quiniela_test;


CREATE TABLE teams(
  id SERIAL NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  grp TEXT NOT NULL
);

CREATE TABLE users(
  id SERIAL NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  points INTEGER DEFAULT 0
);

CREATE TABLE matches(
  id SERIAL NOT NULL PRIMARY KEY,
  local INTEGER NOT NULL,
  local_goals INTEGER DEFAULT -1,
  away INTEGER NOT NULL,
  away_goals INTEGER DEFAULT -1,
  start_date TIMESTAMPTZ,
  FOREIGN KEY(local) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY(away) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE predictions(
  id SERIAL NOT NULL PRIMARY KEY,
  id_user INTEGER NOT NULL,
  id_match INTEGER NOT NULL,
  local INTEGER DEFAULT 0,
  away INTEGER DEFAULT 0,
  FOREIGN KEY(id_match) REFERENCES matches(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY(id_user) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);


INSERT INTO teams(id, name, grp) VALUES
(1, 'Russia', 'A'),
(2, 'Saudi Arabia', 'A'),
(3, 'Egypt', 'A'),
(4, 'Uruguay', 'A'),
(5, 'Portugal', 'B'),
(6, 'Spain', 'B'),
(7, 'Morocco', 'B'),
(8, 'Iran', 'B'),
(9, 'France', 'C'),
(10, 'Australia', 'C'),
(11, 'Peru', 'C'),
(12, 'Denmark', 'C'),
(13, 'Argentina', 'D'),
(14, 'Iceland', 'D'),
(15, 'Croatia', 'D'),
(16, 'Nigeria', 'D'),
(17, 'Brazil','E'),
(18, 'Switzerland','E'),
(19, 'Costa Rica','E'),
(20, 'Serbia','E'),
(21, 'Germany', 'F'),
(22, 'Mexico', 'F'),
(23, 'South Korea', 'F'),
(24, 'Sweden', 'F'),
(25, 'Belgium', 'G'),
(26, 'Panama', 'G'),
(27, 'Tunisia', 'G'),
(28, 'England', 'G'),
(29, 'Polonia', 'H'),
(30, 'Senegal', 'H'),
(31, 'Colombia', 'H'),
(32, 'Japan', 'H');

-- The first 48 matches, qualifications round, the date is in UTC-5
INSERT INTO matches(local, away, start_date) VALUES
(1, 2, '2018-06-14 10:00:00-05'),
(3, 4, '2018-06-15 07:00:00-05'),
(7, 8, '2018-06-15 10:00:00-05'),
(5, 6, '2018-06-15 13:00:00-05'),
(9, 10, '2018-06-16 05:00:00-05'),
(13, 14, '2018-06-16 08:00:00-05'),
(11, 12, '2018-06-16 11:00:00-05'),
(15, 16, '2018-06-16 14:00:00-05'),
(19, 20, '2018-06-17 07:00:00-05'),
(21, 22, '2018-06-17 10:00:00-05'),
(17, 18, '2018-06-17 13:00:00-05'),
(24, 23, '2018-06-18 07:00:00-05'),
(25, 26, '2018-06-18 10:00:00-05'),
(27, 28, '2018-06-18 13:00:00-05'),
(31, 32, '2018-06-19 07:00:00-05'),
(29, 30, '2018-06-19 10:00:00-05'),
(1, 3, '2018-06-19 13:00:00-05'),
(5, 7, '2018-06-20 07:00:00-05'),
(4, 2, '2018-06-20 10:00:00-05'),
(8, 6, '2018-06-20 13:00:00-05'),
(12, 10, '2018-06-21 07:00:00-05'),
(9, 11, '2018-06-21 10:00:00-05'),
(13, 15, '2018-06-21 13:00:00-05'),
(17, 19, '2018-06-22 07:00:00-05'),
(16, 14, '2018-06-22 10:00:00-05'),
(20, 18, '2018-06-22 13:00:00-05'),
(25, 27, '2018-06-23 07:00:00-05'),
(23, 22, '2018-06-23 10:00:00-05'),
(21, 24, '2018-06-23 13:00:00-05'),
(28, 26, '2018-06-24 07:00:00-05'),
(32, 30, '2018-06-24 10:00:00-05'),
(29, 31, '2018-06-24 13:00:00-05'),
(2, 3, '2018-06-25 09:00:00-05'),
(4, 1, '2018-06-25 09:00:00-05'),
(8, 5, '2018-06-25 13:00:00-05'),
(6, 7, '2018-06-25 13:00:00-05'),
(10, 11, '2018-06-26 09:00:00-05'),
(9, 12, '2018-06-26 09:00:00-05'),
(16, 13, '2018-06-26 13:00:00-05'),
(14, 15, '2018-06-26 13:00:00-05'),
(22, 24, '2018-06-27 09:00:00-05'),
(23, 21, '2018-06-27 09:00:00-05'),
(18, 19, '2018-06-27 13:00:00-05'),
(20, 17, '2018-06-27 13:00:00-05'),
(30, 31, '2018-06-28 09:00:00-05'),
(32, 29, '2018-06-28 09:00:00-05'),
(28, 25, '2018-06-28 13:00:00-05'),
(26, 27, '2018-06-28 13:00:00-05');

-- Test users
INSERT INTO users(name, email) VALUES ('Test', 'test@gmail.com');
INSERT INTO users(name, email) VALUES ('John Doe', 'jdoe@gmail.com');


-- test predictions
INSERT INTO predictions(id_user, id_match, local, away) VALUES (1, 1, 3, 2);
INSERT INTO predictions(id_user, id_match, local, away) VALUES (2, 1, 1, 2);
INSERT INTO predictions(id_user, id_match, local, away) VALUES (1, 2, 1, 1);

-- test for the first 2 matches results, cannot remember the true results
UPDATE matches SET local_goals = 5, away_goals = 0 WHERE id = 1;
UPDATE matches SET local_goals = 0, away_goals = 3 WHERE id = 2;
