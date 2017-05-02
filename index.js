var express = require('express');
var exphbs  = require('express-handlebars');
var mongoose = require('mongoose');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');

// connect to Mongoose
mongoose.createConnection(process.env.MONGO_URL);
//mongoose.createConnection('mongodb://asd:asd@ds127731.mlab.com:27731/social-todo-app');

var MongoDBStore = require('connect-mongodb-session')(session);
var Users = require('./models/users.js'); // models usually have uppercase variables
var Tasks = require('./models/tasks.js');

// configure the app
var store = new MongoDBStore({ 
  uri: process.env.MONGO_URL,
  collection: 'sessions'
});

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// checking if there is a session for this cookie
app.use(session({
  secret: process.env.SESSION_SECRET, // do not want this in version control
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto' },
  store: store
})); // middleware for cookie signing

// look up the user information in the database
app.use(function(req, res, next){
  console.log('req.session = ', req.session);
  if(req.session.userId){
    Users.findById(req.session.userId, function(err, user){
      if(!err) {
        // if logged in, this will be whoever is logged in; if not logged in, this will not exist
        res.locals.currentUser = user;
      }
      next();
    });
  }
  else
  {
    next();
  }
});

// check if anyone is logged in
function isLoggedIn(req, res, next){
  if(res.locals.currentUser){
    next();
  }
  else {
    res.sendStatus(403); // prohibited
  }
}

// show user's tasks
function loadUserTasks(req, res, next) {
  // terminate execution if no logged in user, because we want this on the homepage
  if(!res.locals.currentUser){
    return next();
  }
  
  // find tasks where the user is an owner
  Tasks.find({}).or([
    {owner: res.locals.currentUser},
    {collaborators: res.locals.currentUser.email}])
    .exec(function(err, tasks){
    if(!err){
      res.locals.tasks = tasks;
    }
    next();
  });
}

// render homepage with user's tasks
app.get('/', loadUserTasks, function (req, res) {
  res.render('index');
});

// registration checks
app.post('/user/register', function (req, res) {
  if(req.body.password !== req.body.password_confirmation) {
      return res.render('index', {errors: "Password and password confirmation do not match"});
  }
  var newUser = new Users();
  newUser.hashed_password = req.body.password;
  newUser.email = req.body.email;
  newUser.name = req.body.fl_name;
  newUser.save(function(err, user){
    if(user && !err){
      req.session.userId = user._id;
      res.redirect('/');
    }
    var errors = "Error registering you.";
    if(err){
      if(err.errmsg && err.errmsg.match(/duplicate/)){
        errors = 'Account with this email already exists!';
      }
      return res.render('index', {errors: errors});
    }
  });
});

// log in capability
app.post('/user/login', function (req, res) {
  Users.findOne({email: req.body.email},
  function(err, user){
    if(err || !user){
      res.send('Invalid email address');
      return;
    }
    user.comparePassword(req.body.password,
    function(err, isMatch){
      if(err || !isMatch){
        res.send('Invalid password');
      }
      else{
        req.session.userId = user._id;
        res.redirect('/');
      }
    });
  });
});

// log out capability
app.get('/user/logout', function(req, res){
  req.session.destroy();
  res.redirect('/');
});

// all the controllers and routes below this require the user to be logged in
app.use(isLoggedIn);

// create task capability
app.post('/task/create', function(req, res){
  var newTask = new Tasks();
  newTask.owner = res.locals.currentUser._id;
  newTask.title = req.body.title;
  newTask.description = req.body.description;
  newTask.isComplete = false;
  newTask.collaborators = [req.body.collaborator1, req.body.collaborator2, req.body.collaborator3];
  newTask.save(function(err, savedTask){
    if(err || !savedTask){
      res.send('Error saving task!');
    }
    else{
      res.redirect('/');
    }
  });
});

// mark task as complete
app.get('/complete/:id', function(req, res){
  Tasks.findByIdAndUpdate(req.params.id, {
    $set: {
      "isComplete" : true
    }
  }, function(err, toggletask){
    if(err || !toggletask){
      res.send('Error changing task completion status');
    }
    else{
      res.redirect('/');
    }
  });
});

// mark task as incomplete
app.get('/incomplete/:id', function(req, res){
  Tasks.findByIdAndUpdate(req.params.id, {
    $set: {
      "isComplete" : false
    }
  }, function(err, toggletask){
    if(err || !toggletask){
      res.send('Error changing task completion status');
    }
    else{
      res.redirect('/');
    }
  });
});

// delete task
app.get('/delete/:id', function(req, res){
  Tasks.findById(req.params.id, function(err, found){
    if(err || !found){
      res.send('There was a problem deleting that task');
    }
    else{
      if(found.owner.toString() == req.session.userId.toString()){
        Tasks.findByIdAndRemove(req.params.id, function(err, deleted){
          if(err || !deleted){
            res.send('There was a problem deleting that task');
          }
          else{
            res.redirect('/');
          }
        });
      }
      else{
        res.send('Sorry, you do not have permission to delete this task');
      }
    }
  });
});

// starting the server
app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT);
});