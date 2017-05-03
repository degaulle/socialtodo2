var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;

mongoose.createConnection('mongodb://heroku_d68k9f53:h7d9292to5ehgsd6pthm2uuprf@ds127731.mlab.com:27731/heroku_d68k9f53');
//mongoose.createConnection('mongodb://asd:asd@ds127731.mlab.com:27731/social-todo-app');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


 var titleField = {
 	type: String,
 	minlength: 1,
 	maxlength: 500
 };
 var descriptionField = {
 	type: String,
 	minlength: 1,
 	maxlength: 5000
 };

 var personField = {
 	type: String,
 	minlength: 1,
 	maxlength: 50,
 	lowercase: true
 };


var taskSchema = new Schema({
	owner: ObjectId,
    title    : titleField,
    description: descriptionField,
    isComplete : Boolean,
    collaborator1: String,
    collaborator2: String,
    collaborator3: String

});


//This method will be responsible for task completion.
taskSchema.methods.completeTask = function(err) {
	if(!err) {
		this.isComplete = !(this.isComplete);
		this.save();
	}
	else {
		console.log('Error completing a task.');
	}
	return;
};

module.exports = mongoose.model('task', taskSchema);