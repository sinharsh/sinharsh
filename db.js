var Promise = require('promise');
var OrientDB =require('orientjs');
var config = require('./configuration');
var utilities = require('./utilities');
var server = OrientDB({ host: config.publicip, HTTPport: config.db_port, username: config.db_username, password: config.db_password });

var db = server.use({
 name: config.db_name,
 username: config.db_username,
 password: config.db_password
});

var select = function(tableName,fieldName,detail_name) {
               db.query("SELECT FROM "+tableName+" WHERE "+fieldName+"="+"'"+detail_name+"'")
                .then(function(result){
                        return result;
                })
}

module.exports = {
	create : function(tableName,fieldName,userName) {
		db.query("CREATE VERTEX "+tableName+" SET "+fieldName+"="+"'"+userName+"'");
	},
	findDuration : function(tableName,fieldName,detail_name,callback) {
		db.query("SELECT duration from "+tableName+" WHERE "+fieldName+"="+"'"+detail_name+"'")
		.then(function(result) {
		result = JSON.stringify(result);
		result = JSON.parse(result);
		var list = [];
		for(var i = 0; i < result.length; i++) {
                      list.push(result[i].duration);
                }
		callback(list);
	})
	},
	findPrereq : function(tableName,fieldName,detail_name,callback) {
		db.query("select expand( out ('Prerequisites')) From "+tableName+" where "+fieldName+"="+"'"+detail_name+"'")
		.then(function(result) {
			result = JSON.stringify(result);
	                result = JSON.parse(result);
        	        var list = [];
                	for(var i = 0; i < result.length; i++) {
                        	//list.push(result[i].normalised);
				list.push(result[i].name);
                	}
	                callback(list);
		})
	
	},
	selectM : function(tableName,fieldName,detail_name,callback) {
		db.query("SELECT FROM "+tableName+" WHERE "+fieldName+"="+"'"+detail_name+"'")
		.then(function(result) {
		result = JSON.stringify(result);
                result = JSON.parse(result);
		callback(result);
		})
	},
	findDetails : function(username,detail,callback){
		db.query("select expand( out("+"'"+detail+"'"+")) From Users where name="+"'"+username+"'")
		.then(function(result){
		result = JSON.stringify(result);
		result = JSON.parse(result);
		var list = [];
		for(var i = 0; i < result.length; i++) {
			list.push(result[i].normalised);		
		}
		callback(list);	
	})
	},
	insertUserDetails : function(username,detail,detail_name,fromDb,toDb){
		var username;
		originalName = detail_name;
 	        detail_name = detail_name.toLowerCase();
		//var result = select(toDb,"normalised",detail_name);
		db.query("SELECT FROM "+toDb+" WHERE normalised="+"'"+detail_name+"'")
				.then(function (results){
			results = JSON.stringify(results);
	                results = JSON.parse(results);
			console.log("Len : ",results.length);
			if(utilities.isEmpty(results)) {
				console.log("Topic doesnot have");
				console.log("DB : "+toDb +" does not have normalized name as "+ detail_name+ " creating a vertex");
				 db.query("CREATE VERTEX "+toDb+" SET name="+"'"+originalName+"'"+",normalised="+"'"+detail_name+"'");
			}else {
				console.log("Topic Exists");
			}
		});
		var p="(SELECT FROM "+fromDb+" WHERE name = "+"'"+username+"'"+")";
		var q="(SELECT FROM "+toDb+" WHERE normalised = "+"'"+detail_name+"'"+")";
		db.query("select from "+detail+" where out IN "+p+" and in IN "+q)
			.then(function(results){
			results = JSON.stringify(results);
                        results = JSON.parse(results);
			if(utilities.isEmpty(results)) {
				console.log("CREATE EDGE "+detail+" FROM "+p+" TO "+q+" ");
				db.query("CREATE EDGE "+detail+" FROM "+p+" TO "+q+" ")
			}else {
				console.log("EDGE between "+fromDb + " "+toDb+" exists for user"+username);
			}
		});
	}
};



