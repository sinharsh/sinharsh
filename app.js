var restify = require('restify');
var builder = require('botbuilder');
var config = require('./configuration');
var prompts = require('./prompts');
var orient = require('./db');
var utilities = require('./utilities');
var fs = require('fs');

var luisDialog = new builder.LuisDialog(config.model);
var academyDialog = new builder.BotConnectorBot();
//var academyDialog = new builder.BotConnectorBot({ appId: 'proDIGIAdvisor', appSecret: 'd628b2d894e04d6a93e03d4f3ca99ba8' });

//BOT REST end point
var server = restify.createServer();
server.use(academyDialog.verifyBotFramework({ appId: 'chatbot123', appSecret: '59f44ecb3f704bb49f1f2a9635e5e33c' }));
server.post('academybot/v1/messages', academyDialog.verifyBotFramework(),academyDialog.listen());
server.listen(config.port,config.ip,function () {
    console.log('%s listening to %s', server.name, server.url);
})
//LUIS Starts here
academyDialog.add('/luis', luisDialog.onDefault(builder.DialogAction.send(prompts.default_response)));
luisDialog.on('Good', '/userGood');
luisDialog.on('Not Good', '/userBad');
luisDialog.on('Current Skills', '/getCurrentSkills');
luisDialog.on('Find Course', '/findCourse');
luisDialog.on('Helpful', '/helpful');
luisDialog.on('Not Helpful', '/notHelpful');
luisDialog.on('End of Conversation','/endOfConversation');
luisDialog.on('None','/none');
// User just said something, Intent is None , but it might have Topics
academyDialog.add('/none', [
	function(session,args) {
		console.log("Args : ",args);
		for(var i=0; i < args.entities.length; i++) {
			if(args.entities[i].type == "Topic") {
				console.log("entity type Topic");
				var course = args.entities[i].entity;
				if(session.userData.intent === "FindCourse") {
					console.log("Intent FindCOurse");
					orient.selectM("Topic","normalised",course,function(results) {
	                                console.log("result" +results);
        	                	        if(utilities.isEmpty(results)) {
	                	                        session.beginDialog('/topicNotExists');
        	                	                 console.log("Course Doesnot exists");
                                		}else {
                                        		console.log("course exists");
							session.userData.course = course;
	        	                                session.beginDialog('/topicExists');
	                	                }
	
        	        	        });

				} else if(session.userData.intent === "CurrentSkill") {
					console.log("Intent CurrentSkill");
					session.userData.skills = session.userData.skills +"," +course;
				} 			
			}
			else {
				console.log("entity type not topic");
			}
		}
		if(session.userData.intent == "CurrentSkill") {
			session.userData.intent = "FindCourse";
			builder.Prompts.text(session,prompts.thank_you + session.userData.name + prompts.user_direct);
		}//else {
		//	session.beginDialog('/luis');
		//}
	},
	function(session,results) {
		session.beginDialog('/luis');
        }

]);
// User want to find some course info
academyDialog.add('/findCourse' , [
	function(session,args) {
		console.log("Skills Length :"+ args.entities.length);
                console.log("ARgs : "+args);
                console.log('args is ',args);
                console.log('args.intents is ',args.intents);
		var course = [];
		for(var i=0; i < args.entities.length; i++) {
                        var course = args.entities[i].entity;
                        console.log("Course from LUIS:"+course);
			orient.selectM("Topic","normalised",course,function(results) {
				console.log("result" +results);
				if(utilities.isEmpty(results)) {
					session.beginDialog('/topicNotExists');					 
               		                 console.log("Course Doesnot exists");
                        	}else {
                                	console.log("course exists");
					session.userData.course = course;
					session.beginDialog('/topicExists');

                        	}

                	});	
                }

	}
]);
// Topic asked exists in Knowledge base
academyDialog.add('/topicExists' , [
	function(session) {
//		session.send(prompts.recommend_skills);
		console.log("Going to print duration");
                orient.findDuration("Topic","normalised",session.userData.course,function(duration) {
//                       builder.Prompts.text(session,"**"+session.userData.prereq+"**" +" are the pre-requisites for learning "+session.userData.course+".  \n"+"Total Duration for learning "+session.userData.course +" is "+"**"+duration+"**"+" days");
//                      builder.Prompts.text(session,"Total Duration for learning "+session.userData.course +" is "+"**"+duration+"**"+" days");
                        session.userData.duration = duration;
                        console.log("Printed duration");
                });

		orient.findPrereq("Topic","normalised",session.userData.course,function(prereq) {
//			session.userData.prereq = prereq;
//			builder.Prompts.text(session,prereq +" are the pre-requisites for learning "+session.userData.course+"  \n"+
//				"Total Duration for learning "+session.userData.course +" is "+duration);i
//			session.send("**"+prereq+"**" +" are the pre-requisites for learning "+session.userData.course+".");
//			session.send(prompts.recommend_skills+"  \n"+"**"+prereq+"**" +" are the pre-requisites for learning "+session.userData.course+"."+"  \n"+" And the duration for the course is "+session.userData.duration+ " days.");
			var releventPrereq = "";
			var skillMatch = "";
			for(var i=0;i<prereq.length;i++) {
				if(session.userData.skills.indexOf(prereq[i].toLowerCase()) > -1) {
					console.log("Prereq "+prereq[i]+" contains in skills");
					skillMatch = skillMatch +","+ prereq[i];
					
                        	}else {
					console.log("Prereq "+prereq[i]+ " not in skills ");
					releventPrereq = releventPrereq +","+ prereq[i];
				}
			}
			if(skillMatch.charAt(0)===',') {
				skillMatch = skillMatch.slice(1);
			}
			if(releventPrereq.charAt(0)===',') {
                                releventPrereq = releventPrereq.slice(1);
                        }
			console.log("Going to print");
			if(!utilities.isEmpty(skillMatch)) {
				if(!utilities.isEmpty(releventPrereq)) {
			//		session.send("I found that you already have "+skillMatch+" as skill, so you can start with **"+releventPrereq+"**");
				builder.Prompts.text(session,prompts.recommend_skills+"  \n   \n "+"* "+"** "+prereq+"** " +" are the pre-requisites for learning "+session.userData.course+"."+"  \n   \n "+"* I found that you already have "+skillMatch+" as skill, so you can start with **"+releventPrereq+"** "+"  \n   \n "+"* The duration for the course is **"+session.userData.duration+ "** days.");
				}else {
				builder.Prompts.text(session,prompts.recommend_skills+"  \n   \n "+"* "+"**"+prereq+"**" +" are the pre-requisites for learning "+session.userData.course+"."+"  \n  \n "+"* I found that you already have "+skillMatch+" as skill, so you can start with ** "+session.userData.course+"** "+" directly."+"  \n   \n "+"* The duration for the course is **"+session.userData.duration+ "** days.");
//					session.send("I found that you already have "+skillMatch+" as skill, so you can start with **"+session.userData.course+"**"+" directly.");
				}
			} else {
				builder.Prompts.text(session,prompts.recommend_skills+"  \n  \n "+"* "+"** "+prereq+"**" +" are the pre-requisites for learning "+session.userData.course+"."+"  \n   \n "+"* The duration for the course is ** "+session.userData.duration+ "** days.");
			}
			console.log("After print");
		});
		console.log("Going to print duration");
/*		orient.findDuration("Topic","normalised",session.userData.course,function(duration) {
			console.log("Inside duration");
//			 builder.Prompts.text(session,"**"+session.userData.prereq+"**" +" are the pre-requisites for learning "+session.userData.course+".  \n"+"Total Duration for learning "+session.userData.course +" is "+"**"+duration+"**"+" days");
//			builder.Prompts.text(session,"Total Duration for learning "+session.userData.course +" is "+"**"+duration+"**"+" days");
			session.userData.duration = duration;
			console.log("Printed duration");
		});*/
	},
	function(session,results) {
		session.beginDialog('/luis');
	}
]);
// Topic asked not exists in the knowledge base
academyDialog.add('/topicNotExists',[
	function(session) {
		builder.Prompts.text(session,prompts.kb_skill_not_exists);
	},
	function(session,results) {
		session.beginDialog('/luis');
	}
]);
// Get current skills from user
academyDialog.add('/getCurrentSkills', [
        function(session,args) {
                console.log("Skills Length :"+ args.entities.length);
                console.log("ARgs : "+args);
                console.log('args is ',args);
                console.log('args.intents is ',args.intents);
                for(var i=0; i < args.entities.length; i++) {
                        var skill = args.entities[i].entity;
                        console.log("Skill from LUIS:"+skill);
                        session.userData.skills = session.userData.skills +"," +skill;
                        orient.insertUserDetails(session.userData.name,"Skills",skill,"Users","Topic");
                }
		if(session.userData.skills.charAt(0)===',') {
                        session.userData.skills = session.userData.skills.slice(1);
                }

		builder.Prompts.text(session,prompts.thank_you + session.userData.name + prompts.user_direct);		
        },
        function(session,results) {
                session.beginDialog('/luis');
	          
        }

]);
// Bot recommendation was helpful
academyDialog.add('/helpful', [
	function(session,args) {
		console.log("Inside Halp");
		session.userData.happy = "true";
		builder.Prompts.text(session,prompts.ask_more);
	},
	function(session,results) {
		session.beginDialog('/luis');
	}
]);

// The Bot course recommendation was not helpful
academyDialog.add('/notHelpful', [
        function(session,args) {
		console.log("Inside not help");
                session.userData.happy = "false";
		builder.Prompts.text(session,prompts.ask_more_not_help);
        },
	function(session,results) {
		session.beginDialog('/luis');
	}
]);

// End of Conversation . Wind up the conversation
academyDialog.add('/endOfConversation',[
        function(session,args) {
		console.log("Inside End ");
		console.log('args is ',args);
                builder.Prompts.confirm(session,prompts.exit_confirm);
        },
        function(session,results) {
                if(results.response) {
			if(!utilities.isEmpty(session.userData.happy)) {
				if(session.userData.happy == "true") {
					console.log("Happy");
					builder.Prompts.text(session,prompts.happy_exit+"  \n  \n"+"* "+prompts.digi_cmooc+"("+config.digi_cmooc+")"+"  \n  \n"+"* "+prompts.digi_yammer+"("+config.digi_yammer+")"+"  \n  \n"+"* "+prompts.digi_dl+"("+config.digi_dl+")");
				} else {
					console.log("not happy");
					builder.Prompts.text(session,prompts.unhappy_exit + prompts.no_topic_exit+"  \n  \n"+"* "+prompts.digi_cmooc+"("+config.digi_cmooc+")"+"  \n  \n"+"* "+prompts.digi_yammer+"("+config.digi_yammer+")"+"  \n  \n"+"* "+prompts.digi_dl+"("+config.digi_dl+")");
				}
				
			}else {
				///builder.Prompts.text(session,prompts.normal_exit);
				builder.Prompts.text(session,prompts.happy_exit+"  \n  \n"+"* "+prompts.digi_cmooc+"("+config.digi_cmooc+")"+"  \n  \n"+"* "+prompts.digi_yammer+"("+config.digi_yammer+")"+"  \n  \n"+"* "+prompts.digi_dl+"("+config.digi_dl+")");
			}
                    	session.endDialog();
                } else {
                        //session.beginDialog('/userDirectChat');
			builder.Prompts.text(session,prompts.ask_more);
                }
        },
	function(session,results) {
		session.beginDialog('/luis');
	}
]);
// Users direct queries
academyDialog.add('/userDirectChat'[
        function(session) {
		session.userData.intent = "FindCourse";
                builder.Prompts.text(session,prompts.ask_more);
        },
        function(session,results) {
                session.beginDialog('/luis');
        }
]);

// User is happy at the time of chat
academyDialog.add('/userGood', [
        function(session,args) {
		session.userData.mood = "happy";
		if(session.userData.firstTime) {
			session.beginDialog('/userNew');
		}else {
			session.beginDialog('/userExisting');
		}
        }
]);

// User feels bad at the time of chat
academyDialog.add('/userBad',[
	function(session,args) {
		session.userData.mood = "unhappy";
		if(session.userData.firstTime) {
                        session.beginDialog('/userNew');
                }else {
                        session.beginDialog('/userExisting');
                }

	}
]);

// New user. Need to collect the current skills details from user
academyDialog.add('/userNew', [
	function(session) {
		if(session.userData.mood == "unhappy") {
			builder.Prompts.confirm(session,prompts.user_not_ok +" "+session.userData.name+"."+prompts.bot_help + prompts.user_first_time);
		}else {
			 builder.Prompts.confirm(session,prompts.user_ok +" " +session.userData.name+"."+prompts.user_first_time);
		}
	},
	function(session,results) {
		if(results.response) {
			session.userData.intent = "CurrentSkill";
			builder.Prompts.text(session,prompts.current_skills);
		}else {
			session.userData.intent = "FindCourse";
			builder.Prompts.text(session,prompts.thank_you + session.userData.name + prompts.user_direct);
		}
	},
	function(session,results) {
		session.beginDialog('/luis');
	}
	
]);

// Existing user, we have the current skills details
academyDialog.add('/userExisting',[
	function(session) {
		if(session.userData.mood == "unhappy") {
			builder.Prompts.text(session,prompts.user_not_ok+" "+session.userData.name+"."+prompts.user_existing);		
		}else {
			builder.Prompts.text(session,prompts.user_ok + " "+session.userData.name+"."+prompts.user_existing);
		}
	},
	function(session,results) {
		session.userData.intent = "FindCourse";
		session.beginDialog('/luis');
	}

]);

academyDialog.add('/userCheck', [
	function(session) {
                if(utilities.isEmpty(session.userData.name)) {
                        console.log("User name does not exists");
                        builder.Prompts.text(session,prompts.ask_name);
                }else {
                        console.log("user name is :"+ session.userData.name);
			session.beginDialog('/startSession');
                }
        },
        function(session,results) {
                orient.selectM("Users","name",results.response,function(result) {
                        if(utilities.isEmpty(result)) {
                                orient.create("Users","name",results.response);
				console.log("Created user : "+results.response);
				session.userData.name = results.response;
				session.beginDialog('/startSession');
                        }else {
                                //session.send(user_exists);
				session.userData.name = results.response;
				session.beginDialog('/startSession');
                        }
                });
        }

]);

academyDialog.add('/startSession',[
	        function(session) {
                // Re-initialize the session's bot created variables.
                session.userData.happy = "false";
                session.userData.intent = "";
                session.userData.course = "";
                session.userData.prereq = "";
                session.userData.mood = "happy";
		session.userData.duration = "";

                //session.userData.name = "seema";
                // Get Skills,Department,Experience and Courze Preference details for user
                orient.findDetails(session.userData.name,"Skills",function(data) {
                        session.userData.skills = data;
                        console.log("Skills : "+session.userData.skills + " for : "+session.userData.name);
                });
                orient.findDetails(session.userData.name,"Experience",function(data) {
                        session.userData.experience = data;
                        console.log("Experience : "+session.userData.experience + " for : "+session.userData.name);
                });
                orient.findDetails(session.userData.name,"belongs_to",function(data) {
                        session.userData.department = data;
                        console.log("Department : "+session.userData.department + " for : "+session.userData.name);
                });
                orient.findDetails(session.userData.name,"course_preference",function(data) {
                        session.userData.cPreference = data;
                        console.log("Course Preference : "+session.userData.cPreference + " for : "+session.userData.name);
                });
                //builder.Prompts.text(session,"Hello "+session.userData.name+". " + prompts.initial_greet );
		builder.Prompts.text(session,"Hello "+session.userData.name+". " + prompts.initial_greet_copy);

        },
	function(session,results) {
                if((utilities.isEmpty(session.userData.skills)) && (utilities.isEmpty(session.userData.experience))
                        && (utilities.isEmpty(session.userData.department)) && (utilities.isEmpty(session.userData.cPreference))) {
                        console.log("No Skills found for "+session.userData.name);
                        console.log("No Experience found for "+session.userData.name);
                        console.log("No Department found for "+session.userData.name);
                        console.log("No Course Pref found for "+session.userData.name);
                        session.userData.firstTime = true;
                } else {
                        console.log(session.userData.name + " has basic details");
                        console.log("Skills found for "+session.userData.skills);
                        console.log("Experience found for "+session.userData.experience);
                        console.log("Department found for "+session.userData.department);
                        console.log("Course Pref found for "+session.userData.cPreference);
                        // control dir to find course or recommdn chat
                        session.userData.firstTime = false;
                }
                session.beginDialog('/luis');
        }


]);


// Main function where the execution starts
academyDialog.add('/',[
	function(session) {
		session.beginDialog('/userCheck');
	}
		
]);

