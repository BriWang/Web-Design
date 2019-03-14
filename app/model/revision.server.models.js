var mongoose = require('mongoose');
var http = require('https');
mongoose.connect('mongodb://localhost/wikipedia', function (err, db) {
	if(err) throw err;
	console.log("Connection established!");
	db.createCollection("User",function(err,res){
		if(err) throw err;
	});
});

var RevisionSchema = new mongoose.Schema(
		{ 
			 sha1: String,
			 title: String, 
			 timestamp:String, 
			 parsedcomment:String, 
			 revid:Number, 
			 anon:String,
			 user:String, 
			 parentid:Number, 
			 bot:String,
			 admin:String,
			 size:Number},
		 {
			    versionKey: false 
		});

//find author
RevisionSchema.statics.findAuthorRevision = function(name, callback){
	
	return this.find({'user':name}).exec(callback);
}
//test
/*RevisionSchema.statics.findBots = function(bots,callback){
	return this.aggregate([
		{$match:{"bot":{$exists:true}}}
	]).exec(callback);
}*/
//find title
RevisionSchema.statics.findTitle = function(callback){
	return this.aggregate([
		{$group:{_id:"$title", count:{$sum:1}}},
		{$sort:{_id:1}}
		]).exec(callback);
}

RevisionSchema.statics.findLatestByArticle = function(title,callback){
	return this.find({'title':title})
	.sort({'timestamp':-1})
	.limit(1)
	.exec(callback);
}

//find top5 regular user
RevisionSchema.statics.findtop5user = function(titles,callback){
	return this.aggregate([
		{'$match':{title:titles,anon:{$exists:false},bot:{$exists:false},admin:{$exists:false}}},
		{'$group':{'_id':"$user", count: {$sum:1}}},
		{'$sort':{count:-1}},
		{'$limit':5}	
	]).exec(callback);
}
RevisionSchema.statics.apiquery =function(title,timeforapi,callback){
	 titles=title.trim();
	 titles=titles.replace(/ /g,"+");
    rvend=timeforapi;
	var options = {
		hostname: 'en.wikipedia.org',
		path: '/w/api.php?action=query&format=json&prop=revisions&titles='+titles+'&formatversion=2&rvprop=timestamp%7Cuser&rvlimit=max&rvend='+rvend
	};
	http.request(options, function(res){
		var data = '';
		res.on('data', function(chunk){
			data += chunk;
	});
	res.on('end', function(){
		data = JSON.parse(data);
		callback(null,data)
	});
	}).end()//.exec(callback);
}

//find the number of bot by year and article
RevisionSchema.statics.findBotByYear_Article=function(title,year,callback)
{
	let low_range = year.toString()+"-00-00T00:00:00Z";
	let next_year = year + 1;
	let up_range=next_year.toString()+"-00-00T00:00:00Z";
	return this.find({'title':title,"bot": {$exists: true},"timestamp": { $gte: low_range,$lt:up_range}}).count()
	.exec(callback);
}
//find the number of anon by year and article
RevisionSchema.statics.findAnonByYear_Article=function(title,year,callback)
{
	let low_range = year.toString()+"-00-00T00:00:00Z";
	let next_year = year + 1;
	let up_range=next_year.toString()+"-00-00T00:00:00Z";
	return this.find({'title':title,"anon": {$exists: true},"timestamp": { $gte: low_range,$lt:up_range}}).count()
	.exec(callback);
}
//find the number of regular user by year and article
RevisionSchema.statics.findRegularUserByYear_Article=function(title,year,callback)
{
	let low_range = year.toString()+"-00-00T00:00:00Z";
	let next_year = year + 1;
	let up_range=next_year.toString()+"-00-00T00:00:00Z";
	return this.find({'title':title,"bot": {$exists: false},"admin":{$exists: false},"anon":{$exists:false},"timestamp": { $gte: low_range,$lt:up_range}}).count()
	.exec(callback);
}
/**
 * Overall
 */
RevisionSchema.statics.topMost = function(limit,callback){

    return this.aggregate([
        {'$group':{'_id':"$title", 'numOfEdits': {$sum:1}}},
        {'$sort':{numOfEdits:-1}},
        {'$limit':limit}
    ]).exec(callback);
}
RevisionSchema.statics.topLeast = function(limit,callback){

    return this.aggregate( [
        {'$group':{'_id':"$title", 'numOfEdits': {$sum:1}}},
        {'$sort':{numOfEdits:1}},
        {'$limit':limit}
    ]).exec(callback);
}
RevisionSchema.statics.Largest = function(callback){

		return this.aggregate([
		   {'$match':{anon:{$exists:false},bot:{$exists:false},admin:{$exists:false}}},
	        {$group:{_id:{user:"$user",title:"$title"}}},
	        {$group:{_id:"$_id.title",count:{$sum:1}}},
	        {'$sort':{count:-1}},
	        {'$limit':1}
	    ]).exec(callback);

}


RevisionSchema.statics.Smallest = function (callback){
	   return this.aggregate([
	    {'$match':{anon:{$exists:false},bot:{$exists:false},admin:{$exists:false}}},
	    {$group:{_id:{user:"$user",title:"$title"}}},
	    {$group:{_id:"$_id.title",count:{$sum:1}}},
	    {'$sort':{count:1}},
	    {'$limit':1}
	   ]).exec(callback);
}
RevisionSchema.statics.Longest = function(callback){

	return this.aggregate([
	    {'$group':{'_id':'$title','timestamp':{$min:'$timestamp'}}},
	    {'$sort':{timestamp:1}},
	    {'$limit':3}
	]).exec(callback);
}
RevisionSchema.statics.Shortest = function(callback){

	return this.aggregate([
	    {'$group':{'_id':'$title','timestamp':{$min:'$timestamp'}}},
	    {'$sort':{timestamp:-1}},
	    {'$limit':3}
	]).exec(callback);
}

//-----------------------------------------------------------chart
RevisionSchema.statics.getTopYearRange = function(callback){
	return this.aggregate([
		{'$sort':{timestamp:-1}},
		{'$limit':1}
	]).exec(callback);
}
RevisionSchema.statics.getLowYearRange = function(callback){
	return this.aggregate([
		{'$sort':{timestamp:1}},
		{'$limit':1}
	]).exec(callback);
}
RevisionSchema.statics.getTopFiveByYear = function(title,users,callback){
	
	 return this.aggregate([
		{'$match':{title:title,user:{"$in":users}}},
		{'$group':{_id:{year:{"$substr":["$timestamp",0,4]},user:'$user'},'numOfEdits':{$sum:1} }},
		{'$sort':{_id:1}}
		]).exec(callback);
		
}
RevisionSchema.statics.getArticleAnonNumber = function(title,callback){
		
	return this.aggregate([
		{'$match':{anon:"",title:title}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}
	]).exec(callback);
}

RevisionSchema.statics.getArticleBotNumber = function(title,callback){
	   
	return this.aggregate([
		{'$match':{"bot":'1',title:title}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}			
	]).exec(callback);
}

RevisionSchema.statics.getArticleAdminNumber = function(title,callback){
	return this.aggregate([
		{'$match':{"admin":'1',title:title}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}			
	]).exec(callback);	
}

RevisionSchema.statics.getArticleUserNumber = function(title,callback){
	return this.aggregate([
		{'$match':{'admin':{'$exists':false},'bot':{'$exists':false},'anon':{'$exists':false}, title:title}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}			
	]).exec(callback);
}
RevisionSchema.statics.getAnonNumber = function(callback){
	return this.aggregate( [
		{'$match':{anon:""}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}
	]).exec(callback);
}

RevisionSchema.statics.getBotNumber = function(callback){
		
	return this.aggregate([
		{'$match':{"bot":'1'}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}			
	]).exec(callback);
}

RevisionSchema.statics.getAdminNumber = function(callback){
	return this.aggregate([
		{'$match':{"admin":'1'}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}			
	]).exec(callback);
}

RevisionSchema.statics.getUserNumber = function(callback){		
	return this.aggregate([
		{'$match':{'admin':{'$exists':false},'bot':{'$exists':false},'anon':{'$exists':false}}},
		{'$group':{'_id':{"$substr":["$timestamp",0,4]},'numOfEdits':{$sum:1}}},
		{'$sort':{_id:1}}			
	]).exec(callback);	
}
/*-----------*/
var Revision = mongoose.model('Revision', RevisionSchema, 'revisions')

var UserSchema = new mongoose.Schema(
		{
			email:String,
			username:{
				type:String,
				unique: true
			},
			password:String,
			firstname:String,
			lastname:String
		},
		{
			versionKey: false
		});

UserSchema.statics.findUser = function(username, callback){
	return this.find({'username': username}).exec(callback);
}
var User = mongoose.model('User', UserSchema, 'User')

module.exports = {
	Revision: Revision,
	User: User
}
