var http = require('http'), url = require('url'), fs = require('fs');
var socketio=require('socket.io'),mongodb=require('mongodb');

var dbsettings=require('./dbsettings');	//DB_SERVER(="127.0.0.1", DB_PORT=27017, DB_NAME="socketchat", DB_USER, DB_PASS

//定数定義

CHAT_FIRST_LOG=30;	//最初どれだけログ表示するか
CHAT_MOTTO_LOG=30;	//HottoMotto時にログをどれだけ表示するか

CHAT_NAME_MAX_LENGTH = 25;
CHAT_MAX_LENGTH = 1000;

CHAT_LIMIT_TIME = 10;	//0なら無効
CHAT_LIMIT_NUMBER=10;	//CHAT_LIMIT_TIME以内にCHAT_LIMIT_NUMBER回発言したらそれ以上発言できない


HTTP_PORT = 8080;

var mongoserver = new mongodb.Server(dbsettings.DB_SERVER,dbsettings.DB_PORT,{});
var db = new mongodb.Db(dbsettings.DB_NAME,mongoserver,{});


var app = require('express').createServer();

app.get(/^\/(index\.html)?$/, function(req, res){
	res.sendfile(__dirname + '/index.html');
});
app.get(/^\/(log|list)$/, function(req, res){
	res.sendfile(__dirname + "/"+req.params[0]+'.html');
});
app.get(/^\/(line\.js|css\.css)$/, function(req, res){
	res.sendfile(__dirname + "/"+req.params[0]);
});
app.get('/chalog', function(req, res){
	chalog(req.query,function(resobj){
		res.send(resobj, {
			//"Content-Length":result.length,
			"Content-Type":"text/javascript; charset=UTF-8",
		}, 200);
	});
});
app.get('/api', function(){
	
})
app.get('/show', function(req, res){
	res.send({
		users: users,
		users_next: users_next,
		users_s: users_s
	},{"Content-Type":"text/javascript; charset=UTF-8"});
})

var log;
//データベース使用準備
db.open(function(err,_db){
	if(err){
		console.log("DB Open err: "+err);
		throw err;
	}
	db.authenticate(dbsettings.DB_USER, dbsettings.DB_PASS, function(err){
		if(err){
			console.log("DB Auth err: "+err);
			throw err;
		}
		db.collection("log",function(err,collection){
			log=collection;
		});
	});
});
var users=[],users_next=1;

var users_s={};

var filters=[];

//拡張
//ｼｬﾍﾞｯﾀｰ
filters.push(function(logobj){
	var date=new Date(logobj.time);
	var minutes=date.getMinutes();
	if((minutes==0 || minutes==30)&&(date.getSeconds()<30)){
		//半角カナに変換
		var table={
"ぁ":"ｧ", "あ":"ｱ", "ぃ":"ｨ", "い":"ｲ", "ぅ":"ｩ", "う":"ｳ", "ぇ":"ｪ", "え":"ｴ", "ぉ":"ｫ", "お":"ｵ",
"か":"ｶ","が":"ｶﾞ", "き":"ｷ","ぎ":"ｷﾞ", "く":"ｸ","ぐ":"ｸﾞ", "け":"ｹ","げ":"ｹﾞ", "こ":"ｺ","ご":"ｺﾞ",
"さ":"ｻ","ざ":"ｻﾞ", "し":"ｼ","じ":"ｼﾞ", "す":"ｽ","ず":"ｽﾞ", "せ":"ｾ","ぜ":"ｾﾞ", "そ":"ｿ","ぞ":"ｿﾞ",
"た":"ﾀ","だ":"ﾀﾞ", "ち":"ﾁ","ぢ":"ﾁﾞ", "っ":"ｯ", "つ":"ﾂ","づ":"ﾂﾞ", "て":"ﾃ","で":"ﾃﾞ", "と":"ﾄ","ど":"ﾄﾞ",
"な":"ﾅ", "に":"ﾆ", "ぬ":"ﾇ", "ね":"ﾈ", "の":"ﾉ",
"は":"ﾊ","ば":"ﾊﾞ","ぱ":"ﾊﾟ", "ひ":"ﾋ","び":"ﾋﾞ","ぴ":"ﾋﾟ", "ふ":"ﾌ","ぶ":"ﾌﾞ","ぷ":"ﾌﾟ", "へ":"ﾍ","べ":"ﾍﾞ","ぺ":"ﾍﾟ", "ほ":"ﾎ","ぼ":"ﾎﾞ","ぽ":"ﾎﾟ",
"ま":"ﾏ", "み":"ﾐ", "む":"ﾑ", "め":"ﾒ", "も":"ﾓ",
"ゃ":"ｬ", "や":"ﾔ", "ゅ":"ｭ", "ゆ":"ﾕ", "ょ":"ｮ", "よ":"ﾖ",
"ら":"ﾗ", "り":"ﾘ", "る":"ﾙ", "れ":"ﾚ", "ろ":"ﾛ", "わ":"ﾜ", "を":"ｦ", "ん":"ﾝ",
"ヴ":"ｳﾞ","ヷ":"ﾜﾞ", "ヰ":"ｲ", "ヸ":"ｲﾞ","ヹ":"ｴﾞ","ヺ":"ｦﾞ","ー":"ｰ", "ゕ":"ｶ","ゖ":"ｹ",
"゛":"ﾞ", "゜":"ﾟ",
		};
		var bgrs=["ｧｱｶｻﾀﾅﾊﾏﾔｬﾗﾜ","ｨｲｷｼﾁﾆﾋﾐﾘ","ｩｳｸｽﾂﾇﾌﾑﾕｭﾙ","ｪｴｹｾﾃﾈﾍﾒﾚ","ｫｵｺｿﾄﾉﾎﾓﾖｮﾛｦ"];
		var boin=["ｧ","ｨ","ｩ","ｪ","ｫ"];

		logobj.comment=shabetter(logobj.comment);
		logobj.name=shabetter(logobj.name);
		
	}
	
	function shabetter(str){
		return str.replace(/[ァ-ヶ]/g,function(katakana){
			return String.fromCharCode(katakana.charCodeAt(0)+(0x3040-0x30A0));
		}).replace(/[ぁ-ゖ゛゜ヷ-ヺ]/g,function(hiragana){
			return table[hiragana] || hiragana;
		}).replace(/([ｦ-ﾟ]+)/g,function(katakanas){
			var ato="",last=null;
			var pt=katakanas.length;
			while(pt){
				last=katakanas[--pt];
				if(last=="ｰ" || last=="ﾞ" || last=="ﾟ"){
					continue;
				}
				break;
			}
			for(var i=0;i<5;i++){
				if(bgrs[i].indexOf(last)>=0){
					//母音
					for(var j=0;j<5;j++)katakanas+=boin[i];
					break;
				}
			}
			return katakanas;
		});
	}
});


app.listen(HTTP_PORT);

var io=socketio.listen(app);

io.sockets.on('connection',function(socket){
	//ユーザー登録
	var user=null;
	socket.on("regist",function(data){
		if(data.mode=="client"){
			//チャットクライアント
			socket.join("chatuser");
			socket.join("useruser");
			sendFirstLog(socket);
			user=addUser(socket);
			sendFirstUsers(socket);

			//発言
			socket.on("say",function(data){
				says(socket,user,data);
			});

			//入退室
			socket.on("inout",function(data){
				inout(socket,user,data);
			});
	
			//HottoMotto
			socket.on("motto",function(data){
				motto(socket,user,data);
			});
			
			//IDrequest（返信用）
			socket.on("idrequest",function(data){
				idrequest(socket,data);
			});

			//いなくなった
			socket.on("disconnect",function(data){
				discon(socket,user);
			});
		}else if(data.mode=="chalog"){
			//Chalog
			socket.on("query",function(data){
				chalog(data,function(resobj){
					socket.emit("result",resobj);
				});
			});
		}else if(data.mode=="userlist"){
			//ユーザーリスト
			socket.join("useruser");
			sendFirstUsers(socket);
		}
	});
	
});
function sendFirstLog(socket){
	log.find({},{"sort":[["time","desc"]],"limit":CHAT_FIRST_LOG}).toArray(function(err,docs){
		socket.emit("init",{"logs":docs});
	});
}
function sendFirstUsers(socket){
	var roms=users.filter(function(x){return x.rom}).length, p={
		"users":users,
		"roms": roms,
		"actives": users.length-roms
	};
	socket.emit("users",p);
}
function addUser(socket){
	var user={"id":users_next,
		  "name":null,
		  "rom":true,
		  "ip":socket.handshake.address.address,
		  "ua":socket.handshake.headers["user-agent"],
		  };
	users.push(user);
	users_s[user.id]=[];
	socket.broadcast.to("useruser").emit("newuser", user);
	users_next++;
	return user;
}
function delUser(user){
	users=users.filter(function(x){return x!=user});
}
function says(socket,user,data){
	if(user.rom)return;
	
	if(data.comment.length>CHAT_MAX_LENGTH){
		return;
	}
	if(data.comment=="")return;

	if(CHAT_LIMIT_TIME>0){
		var d=Date.now()-1000*CHAT_LIMIT_TIME;
		console.log(users_s[user.id]);
		if((users_s[user.id]=users_s[user.id].filter(function(x){return x>=d})).length>=CHAT_LIMIT_NUMBER){
			//喋りすぎ
			return;
		}
		users_s[user.id].push(Date.now());
	}

	var logobj={"name":user.name,
		    "comment":data.comment,
		    "ip":user.ip,
		    "time":Date.now()
		    };
	if(data.response)logobj.response=data.response;


	makelog(socket,logobj);
}
function makelog(socket,logobj){
	filters.forEach(function(func){
		func(logobj);
	});
	log.insert(logobj,{"safe":true},function(err,docs){
		if(err){
			console.log(err);
			throw err;
		}
		socket.emit("log",logobj);
		socket.broadcast.to("chatuser").emit("log",logobj);
	});
}
function inout(socket,user,data){
	user.rom = !user.rom;
	if(!user.rom){
		if(data.name.length>CHAT_NAME_MAX_LENGTH){
			//文字数超過
			user.rom=true;
			return;
		}
		user.name=data.name;
	}
	//シスログ
	var syslog={"name" : (user.rom?"■退室通知":"■入室通知"),
		    "time":Date.now(),
		    "ip":user.ip,
		    "comment":"「"+user.name+"」さんが"+(user.rom?"退室":"入室"),
		    "syslog":true
	};
	makelog(socket,syslog);
	if(user.rom)user.name=null;

	socket.emit("userinfo",{"rom":user.rom, id: user.id, name: user.name});
	socket.broadcast.to("useruser").emit("inout",{"rom":user.rom, id: user.id, name: user.name});
	

}
function discon(socket,user){
	if(!user.rom){
		var syslog={"name" : "■失踪通知",
			    "time":Date.now(),
			    "ip":user.ip,
			    "comment":"「"+user.name+"」さんいない",
			    "syslog":true
		};
		makelog(socket,syslog);
	}
	delUser(user);
	socket.broadcast.to("useruser").emit("deluser", user.id);
}
function motto(socket,user,data){
	var time=data.time;
	if(!time)return;
	
	log.find({"time":{$lt:time}},{"sort":[["time","desc"]],"limit":CHAT_MOTTO_LOG}).toArray(function(err,docs){
		var resobj={"logs":docs};
		socket.emit("mottoResponse",resobj);
	});
}
function idrequest(socket,data){
	log.findOne(db.bson_serializer.ObjectID.createFromHexString(data.id),function(err,obj){
		socket.emit("idresponse",obj);
	});
}



function chalog(query,callback){
	var page=parseInt(query.page) || 0;
	var value=parseInt(query.value) || 500;
	if(value>5000)value=5000;
	
	var queryobj={};
	
	var optobj={"sort":[["time","desc"]]};
	if(page)optobj.skip=page*value;
	optobj.limit=value;
	
	if(query.starttime){
		queryobj.time={$gte:query.starttime};
	}
	if(query.endtime){
		if(queryobj.time){
			queryobj.time["$lte"]=query.endtime;
		}else{
			queryobj.time={$lte:query.endtime};
		}
	}
	if(query.name){
		//一致
		queryobj.name=query.name;
	}
	if(query.ip){
		//一致
		queryobj.ip=query.ip;
	}
	if(query.comment){
		//服務
		queryobj.comment=new RegExp(query.comment.replace(/(\W)/g,"\\$1"));
	}
	
	var result=log.find(queryobj,optobj).toArray(function(err,docs){
		var resobj={"logs":docs};
		
		callback(resobj);
		
	});
}

