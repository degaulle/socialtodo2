var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

mongoose.createConnection('mongodb://localhost:27017/social-todo');


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