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
});

app.get('/success', function(req, res) {
      res.send({'message': 'Attendance marked successfully!'});
});
 
// this code is executed when a user clicks the form submit button
app.post('/mark', function(req, res) {
  var netid = req.body.netid;
   
  var sql = `INSERT INTO attendance (netid, present) VALUES ('${netid}',1)`;



console.log(sql);
  connection.query(sql, function(err, result) {
    if (err) {
      res.send(err)
      return;
    }
    res.redirect('/success');
  });
});

app.post('/api/login', function(req, res) {
  const umail = req.body.umail;
  const password = req.body.password;
  const sql = `SELECT * FROM users WHERE (email='${umail}' OR username='${umail}') AND password='${password}'`;

  connection.query(sql, function(err, results) {
    if (err) {
      console.error('Error fetching user data:', err);
      res.status(500).send({ message: 'Error fetching user data', error: err });
      return;
    }
    if (results.length === 0) {
      res.status(401).send({ message: 'Invalid email or password' });
      return;
    }

    const user = results[0];
    if (user.password !== password) {
      res.status(401).send({ message: 'Invalid email or password' });
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
  const checkUserSql = 'SELECT * FROM users WHERE email = ?';
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
      const hashPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const insertUserSql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      connection.query(insertUserSql, [username, email, hashPassword], (err, result) => {
          if (err) {
              console.error('Error registering user:', err);
              res.status(500).send({ message: 'Error registering user', error: err });
              return;
          }
          res.send({ message: 'Registration successful!' });
      });
  });
});

// app.post('/login', async (req, res) => {
//   try{
//       let foundUser = users.find((data) => req.body.email === data.email);
//       if (foundUser) {
  
//           let submittedPass = req.body.password; 
//           let storedPass = foundUser.password; 
  
//           const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
//           if (passwordMatch) {
//               let usrname = foundUser.username;
//               res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);
//           } else {
//               res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
//           }
//       }
//       else {
  
//           let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
//           await bcrypt.compare(req.body.password, fakePass);
  
//           res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
//       }
//   } catch{
//       res.send("Internal server error");
//   }
// });

module.exports = app;