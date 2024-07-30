var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');
var connection = mysql.createConnection({
                host: '34.27.8.241',
                user: 'root',
                password: 'abc123',
                database: 'GameRecommender'
});

connection.connect;

var app = express();

// set up ejs view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '../public'));


/* GET home page, respond by rendering index.ejs */
app.get('/', function(req, res) {
  res.render('index', { title: 'Mark Attendance' });

  // find developers that make above average games
  const sql_one = `SELECT d.Name, AVG(r.Rating) as AvgRating, COUNT(g.GameID) as GameCount
    FROM Developer d
    JOIN Game g ON d.DeveloperID = g.DeveloperID
    JOIN Recommendation r ON g.GameID = r.GameID
    GROUP BY d.DeveloperID
    HAVING AVG(r.Rating) > (
        SELECT AVG(r2.Rating)
        FROM Recommendation r2
    )
    ORDER BY AvgRating DESC, GameCount DESC
    LIMIT 15;
    `;
  // top rated games
  const sql_two = `SELECT g.GameID, g.Title, d.Name AS Developer, AVG(r.Rating) AS AvgRating
    FROM Game g
    JOIN Recommendation r ON g.GameID = r.GameID
    JOIN Developer d ON g.DeveloperID = d.DeveloperID
    GROUP BY g.GameID, g.Title, d.Name
    ORDER BY AvgRating DESC
    LIMIT 15;
    `;
  // recommendations based on games played
  /*
  let UserId = 'merp'
  const sql_three = `SELECT g.Title, g.Price, COUNT(p2.GameID) as PlayCount
    FROM Game g
    JOIN Plays p2 ON g.GameID = p2.GameID
    JOIN GameTags gt ON g.GameID = gt.GameID
    JOIN Tag t ON gt.TagID = t.TagID
    WHERE t.TagName IN (
        SELECT DISTINCT t2.TagName
        FROM GameTags gt2
        JOIN Tag t2 ON gt2.TagID = t2.TagID
        JOIN Plays p ON gt2.GameID = p.GameID
    )
    AND g.GameID NOT IN (
        SELECT GameID
        FROM Plays
        WHERE UserID = @${UserId}
    )
    GROUP BY g.GameID
    ORDER BY PlayCount DESC, g.Price ASC
    LIMIT 15;
    `;
    */
  
    // query one
    connection.query(sql_one, function(err, results) {
      if (err) {
        console.error('Error fetching developer data:', err);
        res.status(500).send({ message: 'Error fetching user data', error: err });
        return;
      }
      if (results.length === 0) {
        res.status(401).send({ message: 'No above-average developers found' });
        return;
      }

      const developers = results;
      res.render('index', { title: 'Developer List', developers: developers });
    });

    // query two
    connection.query(sql_two, function(err, results) {
      if (err) {
        console.error('Error fetching top rated games data:', err);
        res.status(500).send({ message: 'Error fetching games data', error: err });
        return;
      }
      if (results.length === 0) {
        res.status(401).send({ message: 'No top rated games found' });
        return;
      }

      const top_games = results;
      res.render('index', { title: 'Top Rated Games', top_games: top_games});
    });

    /*
    connection.query(sql_three, function(err, results) {
      if (err) {
        console.error('Error fetching recommended games data:', err);
        res.status(500).send({ message: 'Error fetching games data', error: err });
        return;
      }
      if (results.length === 0) {
        res.status(401).send({ message: 'No recommended games found' });
        return;
      }

      const recommended_games = results;
      res.render('index', { title: 'Recommended Games', recommended_games: recommended_games});
    });
    */
    
});

// render user_info page and send game titles to frontend
app.get('/user_info', function(req, res) {
  res.send('This is the user info page');

  // query to show list of games,
  // so users can check which games they've played
  const sql_one = `SELECT Title FROM Game LIMIT 300`;
  connection.query(sql_one, function(err, results) {
    if (err) {
      console.error('Error fetching list of games:', err);
      res.status(500).send({ message: 'Error fetching list of games', error: err });
      return;
    }
    if (results.length === 0) {
      res.status(401).send({ message: 'No games in Games table' });
      return;
    }

    const games_list = results;
    res.render('index', { title: 'List of Games', games_list: games_list});
  });

  
  let UserId = 0;
  // this is a list of a user's played games,
  // so they can rate games they've played
  if (UserId == 1) {
    const sql_two = `SELECT Title FROM Game WHERE UserId = '${UserId}'`;
    connection.query(sql_one, function(err, results) {
      if (err) {
        console.error('Error fetching user\'s played games:', err);
        res.status(500).send({ message: 'Error fetching User Games', error: err });
        return;
      }
      if (results.length === 0) {
        res.status(401).send({ message: 'User has played no games!' });
        return;
      }
  
      const user_games = results; 
      res.render('index', { title: 'List of Games', user_games: user_games});
    });
  }
});

// make changes to how many games user has played
app.post('/user_info', function(req, res) {

});




app.post('/api/login', function(req, res) {
  const umail = req.body.umail;
  const password = req.body.password;
  const sql = `SELECT * FROM User WHERE Email='${umail}' OR Username='${umail}'`;

  connection.query(sql, function(err, results) {
    if (err) {
      console.error('Error fetching user data:', err);
      res.status(500).send({ message: 'Error fetching user data', error: err });
      return;
    }
    if (results.length === 0) {
      res.status(401).send({ message: 'Invalid email or password asdf' });
      return;
    }

    const user = results[0];
    if (user.Password !== password) {
      res.status(401).send({ message: 'Incorrect email or password' });
      return;
    }
    else {
      res.json(user);
    }
  });
});

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if the user already exists
  const checkUserSql = 'SELECT * FROM User WHERE Email = ?';
  connection.query(checkUserSql, [email], async (err, results) => {
      if (err) {
          console.error('Error checking user existence:', err);
          res.status(500).send({ message: 'Error checking user existence', error: err });
          return;
      }
      if (results.length > 0) {
          res.status(409).send({ message: 'Email already used' });
          return;
      }

      // Hash the password

      // Insert the new user into the database
      const insertUserSql = 'INSERT INTO User (Username, Email, Password) VALUES (?, ?, ?)';
      connection.query(insertUserSql, [username, email, password], (err, result) => {
          if (err) {
              console.error('Error registering user:', err);
              res.status(500).send({ message: 'Error registering user', error: err });
              return;
          }
          res.send({ message: 'Registration successful!' });
      });
  });
});


module.exports = app;