/**
 * The file to start a server
 *
 */

var express = require('express');
var path = require('path');
var bodyParser = require("body-parser");
var revroutes = require('./app/routes/revision.server.routes');
var session = require('express-session');
var cookieParser = require('cookie-parser');

var app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.set('views', path.join(__dirname,'./app/views'));
//session
app.use(session({
	key: 'user_id',
	secret:"This is a secret",
	resave: false,
	saveUninitialized:false,
}));
app.use(function(req,res,next){
	if(req.session.login == undefined){
		req.session.login = false;
		res.clearCookie("login");
		res.clearCookie("user_id");
	}
	next();
});
app.use(express.static(path.join(__dirname, './public')));
app.use('/',revroutes);
app.listen(8888, function (err) {
	if(err) throw err;
	console.log('Revision app listening on port 8888!')
	});
	
module.exports = app;