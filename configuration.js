
/**
Configurations
**/
module.exports = {
       // ip :"10.111.187.85",
	    ip :"52.187.62.217",
        publicip : "54.90.159.251",
        db_port : 8080,

	port : 5601,
	db_username : 'root',
	db_password : 'root',
	db_name : 'chatbot',
	//model : "https://api.projectoxford.ai/luis/v1/application?id=7b180b80-5642-48b2-8cf3-e45fa8aa50b0&subscription-key=bfdc0e3842e94b4b964c6eb391714ad1&q=",
	model :"https://api.projectoxford.ai/luis/v1/application?id=7b180b80-5642-48b2-8cf3-e45fa8aa50b0&subscription-key=bfdc0e3842e94b4b964c6eb391714ad1&q=",
	profiles : {
		"Front End Developer":{
			option: "1"
		},
		"Mobile Android Developer":{
			option:"2"
		},
		"Mobile IOS Developer":{
		option:"3"
		},
		"UX Designer":{
		option:"4"
		}
	},
	digi_dl:'DigitalUniversity@cognizant.com',
	digi_yammer:'https://www.yammer.com/cognizant.com/#/threads/inGroup?type=in_group&feedId=6420431',
	digi_cmooc:'https://cmooc.cognizant.com/course/view.php?id=33'

}

