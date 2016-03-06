var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var Users = require('./models/users.js'); // models usually have uppercase variables

// configure the app
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', function (req, res) {
  Users.count(function (err, users) {
    if (err) {
      res.send('error getting users');
    }
    else {
    res.render('index', {userCount: users.length});
    }
  });
});

app.post('/user/register', function (req, res) {
  var newUser = new Users();
  newUser.hashed_password = req.body.password;
  newUser.email = req.body.email;
  newUser.name = req.body.fl_name;
  newUser.save(function(err){
    if (err) {
      res.send('There was a problem saving the user');
    }
    else
    {
      res.redirect('/');
    }
  })
});

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
});