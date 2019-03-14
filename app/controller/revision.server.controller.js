var model = require("../model/revision.server.models");
var Revision = model.Revision;
var User = model.User;
var fs = require("fs");
var async = require('async');
var allBot=[];
var allAdmin=[];
var titles = new Object();
var overall = new Object();
var title = null;
var number;
var top5 = [];

//read bot files
fs.readFile("/Users/steveLEE/Desktop/study/COMP5347/asm2/Dataset/Bot.txt","utf-8",function(err,data){  
    if(err){  
        console.log(err);  
    }else{  
    	allBot = data.split('\n')  
    }  
});
//read admin files
fs.readFile("/Users/steveLEE/Desktop/study/COMP5347/asm2/Dataset/Admin.txt","utf-8",function(err,data){  
    if(err){  
        console.log(err);  
    }else{  
    	allAdmin = data.split('\n')  
    
    }  
});
//find top year
var topYear;
Revision.getTopYearRange(function(err,result){
	if(err) throw err;
	else{
		topYear = parseInt(result[0].timestamp.substring(0,4));
	}
});
var minimumYear;
Revision.getLowYearRange(function(err,result){
	if(err) throw err;
	else{
		minimumYear = parseInt(result[0].timestamp.substring(0,4));
	}
});
//find minimum year
//---------------------------------------
global.updateTitles=Revision.findTitle(function(err,result){
	if(err) throw err;
	else titles["titles"] = result;
});

Revision.update({"user":{$in: allBot}},{$set:{'bot':1}},{'multi':true},function(err,result){
	if (err){
		console.log("Update bot error!")
	}
});
Revision.update({"user":{$in: allAdmin}},{$set:{'admin':1}},{'multi':true},function(err,result){
	if (err){
		console.log("Update admin error!")
	}
});
module.exports.home = function(req,res){
	if(req.session.login == undefined) req.session.login = false;
	res.render("index.ejs",{warning: undefined});
}
//test
/*module.exports.findBot = function(req,res){
	console.log(allBot);
	Revision.findBots(allBot,function(err,result){
		if(err) throw err;
		else{
			console.log(result);
		}
	});
}*/
module.exports.revision = function(req,res){	
	if(req.session.login!=true){
		return res.render("index.ejs",{warning:"You have to log in to view the revision page!"});
	}
	
	async.series([
		function(callback){
			updateTitles;
			callback(null);
		},
		function(callback){
			Revision.topMost(3,function(err,result){
				if(err) throw err;
				else{
					let most = [];
					for(let i = 0; i < result.length; i++){
						most.push(result[i]._id);
					}
					overall["most"] = most;
					callback(null);
				}
			});
		},
		function(callback){
			Revision.topLeast(3,function(err,result){
				if(err) throw err;
				else{
					let least = [];
					for(let i = 0; i < result.length; i++){
						least.push(result[i]._id);
					}
					overall["least"] = least;
					callback(null);
				}
			});
		},
		function(callback){
			Revision.Largest(function(err,result){
				if(err) throw err;
				else{
					overall["largest"]=result[0]._id;
					callback(null);
				}
			});
		},
		function(callback){
			Revision.Smallest(function(err,result){
				if(err) throw err;
				else{
					overall["smallest"]=result[0]._id;
					callback(null);
				}
			});
		},
		function(callback){
			Revision.Longest(function(err,result){
				if(err) throw err;
				else{
					let arr = [];
					for(let i = 0; i < result.length; i++){
						arr.push(result[i]._id);
					}
					overall["longest"]=arr;
					callback(null);
				}
			});
		},
		function(callback){
			Revision.Shortest(function(err,result){
				if(err) throw err;
				else{
					let arr = [];
					for(let i = 0; i < result.length; i++){
						arr.push(result[i]._id);
					}
					overall["shortest"]=arr;
					callback(null);
				}
			});
		},
		function(callback){
			return res.render("revision.ejs",{result: undefined, titles: titles, overall:overall});
		}
	]);
	
	
}
//-------------------------------------------------------------------------






//--------------------------------------------------------------------------
module.exports.findArticleData=function(req,res){
	if(req.query.titlename.length != 0){
		title = req.query.titlename;
	}else{
		title = req.query.title.split(" | ")[0];
	}
	console.log(title);
	Revision.findLatestByArticle(title, function (err,result) {
        if (err){
        	console.log("Cannot find most revision!")
        }else{ 
        	time = result[0].timestamp;
 
            var currenttime = new Date().getTime();
            var datatime = new Date(Date.parse(time)).getTime();
            var day = 60000*60*24;
            var compareresult=currenttime-datatime;
            	if(compareresult>day){
            		Revision.apiquery(title,time,function (err,result) {
                        if (err){
                            console.log("Cannot find most revision!")
                        }else{
                        
                        	for(var i=1;i<result.query.pages[0].revisions.length;i++){                        	
    		                       //create new revision object
    							var revision = new Revision ();
    		                        revision.title=result.query.pages[0].title;
    		                        revision.user=result.query.pages[0].revisions[i-1].user;
    		                        revision.timestamp=result.query.pages[0].revisions[i-1].timestamp;
    		                        if(allBot.indexOf(revision.user)!=-1)
    		                        	revision.bot=1;
    		                        else if(allAdmin.indexOf(revision.user)!=-1)
    		                        	revision.admin=1;
    							
    							//save newly created revision to database
    							revision.save(function(err){
    							    if(err){
    							        return console.error(err);
    							    }else{
    					
    							    }
    							});

                        	}
                        	let length = result.query.pages[0].revisions.length-1;
    		                console.log(length + " revisions added!");
    		                
    		                
                        }
                    })
            	}
            	else{
            		console.log("The article is up-to-date!");
            	}
        } 
    });
	setTimeout(function(){
		Revision.findTitle(function(err,result){
        	if(err) throw err;
        	else{
        		titles["titles"] = result;
        		let map = new Object();
        		map["title"] = title;
        		for(let i = 0; i < titles["titles"].length; i++){
        			if(titles["titles"][i]._id == title){
        				map["count"] = titles["titles"][i].count;
        				break;
        			}
        		}
        		Revision.findtop5user(title, function (err,result) {
        			if (err){
        				console.log("Cannot find top 5 user!");
        			}else{
        				let top = new Object();
        				for(let k=0;k<result.length;k++)
        				{
        					top[result[k]._id] = result[k].count;
        				}
        				map["top"] = top;
        				titles["articledata"] = map;
        			
        				return res.render("revision.ejs",{result: undefined, titles: titles, overall:overall});

        			}
        		});
        	}
        });
		
	},5000);
}
module.exports.changeRevision=function(req,res){
	let number = parseInt(req.query.number);
	async.series([
		function(callback){
			Revision.topMost(number,function(err,result){
				if(err) throw err;
				else{
					let most = [];
					for(let i = 0; i < result.length; i++){
						most.push(result[i]._id);
					}
					overall["most"] = most;
					callback(null);
				}
			});
		},
		function(callback){
			Revision.topLeast(number,function(err,result){
				if(err) throw err;
				else{
					let least = [];
					for(let i = 0; i < result.length; i++){
						least.push(result[i]._id);
					}
					overall["least"] = least;
					callback(null);
				}
			});
		},
		function(callback){
			return res.render("revision.ejs",{result: undefined, titles: titles, overall:overall});
		}
	]);
	
}

module.exports.findAuthor=function(req,res){
	
	let name = req.query.name;  
    
	Revision.findAuthorRevision(name, function(err,result){
		var map = new Object();
		for(let i = 0; i < result.length; i++){
			if(map[result[i].title] != undefined){
				map[result[i].title].push(result[i].timestamp);
			}else{
				map[result[i].title] = [result[i].timestamp];
			}
		}
		if (err){
			throw err;
		}else{
			return res.render("revision.ejs",{result: map, titles: titles, overall:overall});
		}
	})	
}

module.exports.login=function(req,res){
	let username = req.body.uname;
	let password = req.body.psw;
	User.findUser(username, function(err, result){
		if(result.length != 1){
			return res.render("index.ejs",{warning:"Username does not exist! Please register first!"});
		}else if(result[0].password != password){
			return res.render("index.ejs",{warning:"Incorrect password! Please try again!"});
		}else if(result[0].password == password){
			req.session.login = true;
			let message = "Log in successfully! Hello, " + result[0].firstname + " " + result[0].lastname +"!";
			res.cookie('login',true);
			return res.render("index.ejs",{warning:message});
		}
	});
}
module.exports.logout=function(req,res){
	req.session.login = false;
	res.clearCookie('login');
	res.clearCookie('user_id');
	res.redirect('/');
}
module.exports.signup=function(req,res){
	let username = req.body.upusn;
	let password = req.body.uppw;
	let repassword = req.body.uprepw;
	let email = req.body.upem;
	let first = req.body.upfn;
	let last = req.body.upln;
	if(first.trim().length == 0){
		let map = "Invalid first name! Sign up failed!";
		return res.render("index.ejs",{warning:map});
	}
	else if(last.trim().length == 0){
		let map = "Invalid last name! Sign up failed!";
		return res.render("index.ejs",{warning:map});
	}
	else if(username.trim().length == 0){
		let map = "Invalid username! Sign up failed!";
		return res.render("index.ejs",{warning:map});
	}
	else if(password != repassword){
		let map = "Password doesn't match! Sign up failed!";
		return res.render("index.ejs",{warning:map});
	}
	
	let user = {
		email: email,
		username: username,
		password: password,
		firstname: first,
		lastname: last
	}
	User.create(user, function(err, user){
		if(err){
			return res.render("index.ejs",{warning: "Username already exists! Sign up failed!"});
		}
		else {
			let map = "Congradulations! Sign up succeeded!";
			return res.render("index.ejs",{warning: map})
		}
	});
}




//data for creating a bar chart of overall revision distributed by year and user type
module.exports.overalldata=function(req,res){
	var Anon = [];
	var Admin = [];
	var Bot = [];
	var User = [];
	async.series([
		function(callback){	
			Revision.getAnonNumber(function(err,result){
				if (err) throw err;
				else{
					Anon.splice(0,Anon.length);
					for (var i = minimumYear; i <= topYear ; i++){
						Anon.push({_id:i.toString(),numOfEdits:0});
					}
					for (let key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								Anon[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits'];
						}
					}
	                callback(null)
				}				
			})
		},
		function(callback){
			Revision.getBotNumber(function(err,result){
				if (err) throw err;
				else{
					Bot.splice(0,Bot.length);
					for (var i = minimumYear; i <= topYear ; i++){
						Bot.push({_id:i.toString(),numOfEdits:0})
					}
					for (let key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								Bot[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
						}
					}
					
					callback(null)
				}				
			})	
		},
		function(callback){
			Revision.getAdminNumber(function(err,result){
				if (err) throw err;
				else{
					Admin.splice(0,Admin.length);
					for (var i = minimumYear; i <= topYear ; i++){
						Admin.push({_id:i.toString(),numOfEdits:0})
					}
					for (let key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								Admin[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
						}
					}
					
					callback(null)
				}				
			})	
		},
		function(callback){
			Revision.getUserNumber(function(err,result){
			if(err) throw err;
			else{
				User.splice(0,User.length);
				for (var i = minimumYear; i <= topYear ; i++){
					User.push({_id:i.toString(),numOfEdits:0})
				}
				for (let key in result){
					for (var i = minimumYear; i <= topYear ; i++){
						if (result[key]['_id'] == i.toString())
							User[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
					}
				}			
				//convert data to google bar chart format
				var barChart = []
				barChart.push(['Year','Administrator','Anonymous','Bot','Regular user'])
				for (var year = minimumYear ; year <= topYear ; year++){
					barChart.push([year.toString(),Admin[year-minimumYear]['numOfEdits'],Anon[year-minimumYear]['numOfEdits'],Bot[year-minimumYear]['numOfEdits'],User[year-minimumYear]['numOfEdits']])
				}
				//convert data to google pie chart format
				var pieChart = [];
				pieChart.push(['User Type','Revision Number'])
				let adminCount = 0;
				let anonCount = 0;
				let botCount = 0;
				let ruCount = 0;
				for(var year = minimumYear; year <= topYear; year++){
					adminCount += Admin[year-minimumYear]['numOfEdits'];
					anonCount += Anon[year-minimumYear]['numOfEdits'];
					botCount += Bot[year-minimumYear]['numOfEdits'];
					ruCount += User[year-minimumYear]['numOfEdits'];
				}
				pieChart.push(['Administrator', adminCount]);
				pieChart.push(['Anonymous', anonCount]);
				pieChart.push(['Bot', botCount]);
				pieChart.push(['Regular user', ruCount]);
				res.json({bar:barChart,pie:pieChart});
			}				
		})		
		}
	]);
	
}

module.exports.getTopFive = function(req,res){
	title = req.query.title
	users = req.query.users
//	console.log(title)
	Revision.getTopFiveByYear(title,users,function(err,result){
		if(err) throw err
		else{
			//convert data to google char format
			var chartData = new Array()
			var tmp = ['Year'].concat(users)
			chartData.push(tmp)
			
			for (var i = minimumYear; i <= topYear ; i++){
				var P = [i]
				for (var j = 0; j < users.length ; j++){
					P.push(0)
				}
				chartData.push(P)
			}
//			console.log(result)
			for (var i in result){
				for (var j in chartData[0]){
					if(result[i]['_id']['user'] == chartData[0][j]){
						year = parseInt(result[i]['_id']['year'])
						chartData[year-minimumYear][j] += result[i]['numOfEdits']
					}
				}
			}
			
			for (var i = minimumYear; i < topYear ; i++){
				chartData[i-minimumYear][0] = chartData[i-minimumYear][0].toString()
			}
//			console.log(chartData)
			
			res.json({result:chartData})
		}
	})	
}

module.exports.individualdata=function(req,res){
	var anon = [];
	var admin = [];
	var bot = [];
	var ru = [];
	var topfive = [];
	var topfivedata = new Object();;
	var title = req.params.title;
	async.series([
		function(callback){
			Revision.findtop5user(title,function(err,result){
				if(err) throw err;
				else{
					for(let i = 0; i < result.length; i++){
						topfive.push(result[i]._id);
					}
					callback(null);
				}
			});
		},
		function(callback){
			Revision.getTopFiveByYear(title,topfive,function(err,result){
				if(err) throw err;
				else{
					for(let i = 0; i < result.length; i++){
						if(topfivedata[result[i]._id.year] == undefined){
							topfivedata[result[i]._id.year] = new Object();
						}
						for(let j = 0; j < topfive.length; j++){
							if(topfivedata[result[i]._id.year][topfive[j]] == undefined){
								topfivedata[result[i]._id.year][topfive[j]] = 0;
							}
						}
						topfivedata[result[i]._id.year][result[i]._id.user] += result[i].numOfEdits;
					}
					callback(null);
				}
			});
		},
		function(callback){	
			Revision.getArticleAnonNumber(title,function(err,result){
				if(err) throw err
				else{
					anon.splice(0,anon.length);
					for (var i = minimumYear; i <= topYear ; i++){
						anon.push({_id:i.toString(),numOfEdits:0})
					}
					for (var key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								anon[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
						}
					}
					callback(null)
				}		
			})
		},
		function(callback){	
			Revision.getArticleBotNumber(title,function(err,result){
				if(err) throw err
				else{
					bot.splice(0,bot.length);
					for (var i = minimumYear; i <= topYear ; i++){
						bot.push({_id:i.toString(),numOfEdits:0})
					}
					for (var key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								bot[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
						}
					}
					callback(null)
				}				
			})	
		},
		function(callback){
			Revision.getArticleAdminNumber(title,function(err,result){
				if(err) throw err
				else{
					admin.splice(0,admin.length);
					for (var i = minimumYear; i <= topYear ; i++){
						admin.push({_id:i.toString(),numOfEdits:0})
					}
					for (var key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								admin[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
						}
					}
					callback(null)
				}				
			})	
		},
		function(callback){
			Revision.getArticleUserNumber(title,function(err,result){
				if(err) throw err
				else{
					ru.splice(0,ru.length);
					for (var i = minimumYear; i <= topYear ; i++){
						ru.push({_id:i.toString(),numOfEdits:0})
					}
					for (var key in result){
						for (var i = minimumYear; i <= topYear ; i++){
							if (result[key]['_id'] == i.toString())
								ru[i-minimumYear]['numOfEdits'] += result[key]['numOfEdits']
						}
					}
					
					//convert data to google bar chart format
					var barChart = []
					barChart.push(['Year','Administrator','Anonymous','Bot','Regular user'])
					for (var year = minimumYear ; year <= topYear ; year ++){
						barChart.push([year.toString(),admin[year-minimumYear]['numOfEdits'],anon[year-minimumYear]['numOfEdits'],bot[year-minimumYear]['numOfEdits'],ru[year-minimumYear]['numOfEdits']])
					}
					//convert data to google pie chart format
					var pieChart = [];
					pieChart.push(['User Type','Revision Number'])
					let adminCount = 0;
					let anonCount = 0;
					let botCount = 0;
					let ruCount = 0;
					for(var year = minimumYear; year <= topYear; year++){
						adminCount += admin[year-minimumYear]['numOfEdits'];
						anonCount += anon[year-minimumYear]['numOfEdits'];
						botCount += bot[year-minimumYear]['numOfEdits'];
						ruCount += ru[year-minimumYear]['numOfEdits'];
					}
					pieChart.push(['Administrator', adminCount]);
					pieChart.push(['Anonymous', anonCount]);
					pieChart.push(['Bot', botCount]);
					pieChart.push(['Regular user', ruCount]);
					//convert data to google bar chart data
					fiveresult = [];
					let head = ['year'];
					for(let i = 0; i < topfive.length; i++){
						head.push(topfive[i]);
					}
					fiveresult.push(head);
					for(let key in topfivedata){
						let temp = [key];
						for(let k in topfivedata[key]){
							for(let i = 0; i < topfive.length; i++){
								if(k == topfive[i]){
									temp.push(topfivedata[key][k]);
								}
							}	
						}
						fiveresult.push(temp);
					}
					res.json({topfive:fiveresult,bar:barChart,pie:pieChart});	
				}				
			})	
		}
	]);
	
}
