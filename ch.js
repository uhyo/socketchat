var socketio=require('socket.io'),mongodb=require('mongodb');

var settings=require('./settings');
/*
exports.DB_SERVER="127.0.0.1";
exports.DB_PORT=27017;
exports.DB_NAME="socketchat";
exports.DB_USER="test";
exports.DB_PASS="test";

exports.CHAT_FIRST_LOG=30;	//最初どれだけログ表示するか
exports.CHAT_MOTTO_LOG=30;	//HottoMotto時にログをどれだけ表示するか

exports.CHAT_NAME_MAX_LENGTH = 25;
exports.CHAT_MAX_LENGTH = 1000;

exports.CHAT_LIMIT_TIME = 10;	//0なら無効
exports.CHAT_LIMIT_NUMBER=10;	//CHAT_LIMIT_TIME以内にCHAT_LIMIT_NUMBER回発言したらそれ以上発言できない

exports.CHAT_APIUSER_TIMEOUT = 60;	//APIユーザーがいなくなるまでの時間（秒）
exports.CHAT_APIUSER_SESSIONID_LENGTH = 20;

exports.HTTP_PORT = 8080;
*/

var mongoserver = new mongodb.Server(settings.DB_SERVER,settings.DB_PORT,{});
var db = new mongodb.Db(settings.DB_NAME,mongoserver,{});


var app = require('express').createServer();

app.get(/^\/(index\.html)?$/, function(req, res){
	res.sendfile(__dirname + '/index.html');
});
app.get(/^\/(log|list|apiclient)$/, function(req, res){
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
app.get(/^\/api\/(.*)$/, function(req,res){
	api(req.params[0],req,res);
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
	db.authenticate(settings.DB_USER, settings.DB_PASS, function(err){
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
//hito-maru-gogo
filters.push(function(logobj){
	var tms=["まる","ひと","ふた","さん","よん","GO!","ろく","なな","はち","きゅう"];
	var date=new Date(logobj.time);
	if(date.getMinutes()==55){
		var h=date.getHours();
		var com=tms[h/10|0]+tms[h%10]+"☆GO!GO!";
		var add={"name":"span","attributes":{},"style":{"font-size":"2em"},"child":com};
		logobj.comment=pushLogobj(logobj.comment,add);
	}
});
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

		logobj.comment=forEachTextLogobj(logobj.comment,shabetter);
		logobj.name=shabetter(logobj.name);
		
	}
	
	function shabetter(str){
		return str.replace(/[ァ-ヶ]/g,function(katakana){
			return String.fromCharCode(katakana.charCodeAt(0)+(0x3040-0x30A0));
		}).replace(/[ぁ-ゖ゛゜ヷ-ヺー]/g,function(hiragana){
			return table[hiragana] || hiragana;
		}).replace(/(ｦ+|[ｧ-ｮｱ-\uFF9F]+)/g,function(katakanas){	//\uFF9F: 半角半濁点
			var ato="",last=null;
			var pt=katakanas.length;
			while(pt){
				last=katakanas[--pt];
				if(last=="ﾞ" || last=="ﾟ"){
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
function pushLogobj(to,logobj){
	if(typeof to=="object"){
		if(to instanceof Array){
			to.push(logobj);
			return to;
		}else{
			to.child=pushlogobj(to.child,logobj);
			return to;
		}
	}else{
		return [to,logobj];
	}
}
function forEachTextLogobj(logobj,callback){
	if(typeof logobj=="object"){
		if(logobj instanceof Array){
			return logobj.map(function(x){
				return forEachTextLogobj(x,callback);
			});
		}else{
			logobj.child=forEachTextLogobj(logobj.child,callback);
			return logobj;
		}
	}else{
		return callback(logobj);
	}
}

app.listen(settings.HTTP_PORT);

var io=socketio.listen(app);

function User(id,name,ip,rom,ua){
	this.id=id,this.name=name,this.ip=ip,this.rom=rom,this.ua=ua;
	
	this.ss=[];	//最近の発言
}
User.prototype.getUserObj=function(){
	//外部出力用
	return {"id":this.id,"name":this.name,"ip":this.ip,"rom":this.rom,"ua":this.ua};
};
User.prototype.type="user";
//says,inout,motto,idRequest
User.prototype.says=function(data){
	if(this.rom)return;
	
	if(data.comment.length>settings.CHAT_MAX_LENGTH){
		return;
	}
	if(data.comment=="")return;

	if(settings.CHAT_LIMIT_TIME>0){
		var d=Date.now()-1000*settings.CHAT_LIMIT_TIME;
		if((this.ss=this.ss.filter(function(x){return x>=d})).length>=settings.CHAT_LIMIT_NUMBER){
			//喋りすぎ
			return;
		}
		this.ss.push(Date.now());
	}

	var logobj={"name":this.name,
		    "comment":data.comment,
		    "ip":this.ip,
		    "time":Date.now()
		    };
	if(data.response)logobj.response=data.response;


	makelog(this,logobj);
};
User.prototype.inout=function(data){
	this.rom = !this.rom;
	if(!this.rom){
		if(!data.name || data.name.length>settings.CHAT_NAME_MAX_LENGTH){
			//文字数超過
			this.rom=true;
			return;
		}
		this.name=data.name;
	}
	//シスログ
	var syslog={"name" : (this.rom?"■退室通知":"■入室通知"),
		    "time":Date.now(),
		    "ip":this.ip,
		    "comment":"「"+this.name+"」さんが"+(this.rom?"退室":"入室"),
		    "syslog":true
	};
	makelog(this,syslog);
	if(this.rom)this.name=null;
	
	this.inoutSplash();

};
User.prototype.inoutSplash=function(){
	var socket = this.socket || getAvailableSocket(), obj={"rom":this.rom, id: this.id, name: this.name};
	socket && (socket.emit("inout",obj), socket.broadcast.to("useruser").emit("inout",obj));
	toapi(function(x){
		x==this || x.userinfos.push({"name":"inout","user":obj});
	}.bind(this));
};
//mottoの該当レス探す処理
User.prototype.findMotto=function(data,callback){
	var time=data.time;
	if(!time)return;
		log.find({"time":{$lt:time}},{"sort":[["time","desc"]],"limit":settings.CHAT_MOTTO_LOG}).toArray(callback);	
};
//いなくなった！❾
User.prototype.discon=function(){
	if(!this.rom){
		var syslog={"name" : "■失踪通知",
			    "time":Date.now(),
			    "ip":this.ip,
			    "comment":"「"+this.name+"」さんいない",
			    "syslog":true
		};
		makelog(this,syslog);
	}
	delUser(this);
	this.delUserSplash();
};
User.prototype.delUserSplash=function(){
	var socket=this.socket;
	if(!socket){
		socket=getAvailableSocket();
		socket && socket.emit("deluser",this.id);
	}
	socket && socket.broadcast.to("useruser").emit("deluser", this.id);
	toapi(function(x){
		x.userinfos.push({"name":"deluser","id":this.id});
	}.bind(this));
};


function SocketUser(id,name,ip,rom,ua,socket){
	User.apply(this,arguments);
	this.socket=socket;
}
SocketUser.prototype=new User;
SocketUser.prototype.type="socket";
SocketUser.prototype.motto=function(data){
	this.findMotto(data,function(err,docs){
		var resobj={"logs":docs};
		this.socket.emit("mottoResponse",resobj);
	}.bind(this));
};
SocketUser.prototype.idrequest=function(data){
	log.findOne(db.bson_serializer.ObjectID.createFromHexString(data.id),function(err,obj){
		this.socket.emit("idresponse",obj);
	}.bind(this));
};

function APIUser(id,name,ip,rom,ua,sessionId){
	User.apply(this,arguments);
	this.sessionId=sessionId;
	
	this.logs=[];
	
	this.userinfos=[];
	
	this.timerid=null;
}
APIUser.prototype=new User;
APIUser.prototype.type="api";
APIUser.prototype.motto=function(data,res){
	this.findMotto(data,function(err,docs){
		res.send({"error":false,
			"logs":docs,
		},{"Content-Type":"text/javascript; charset=UTF-8"});
	}.bind(this));
};
APIUser.prototype.idrequest=function(data,res){
	log.findOne(db.bson_serializer.ObjectID.createFromHexString(data.id),function(err,obj){
		res.send(obj,{"Content-Type":"text/javascript; charset=UTF-8"});
	}.bind(this));
};
APIUser.prototype.oxygen=function(){
	clearTimeout(this.timerid);
	this.timerid=setTimeout(this.discon.bind(this),1000*settings.CHAT_APIUSER_TIMEOUT);
};

io.sockets.on('connection',function(socket){
	//ユーザー登録
	var user=null;
	socket.on("regist",function(data){
		if(data.mode=="client"){
			//チャットクライアント
			socket.join("chatuser");
			socket.join("useruser");
			user=addSocketUser(socket);
			sendFirstLog(user);
			sendFirstUsers(user);

			//発言
			socket.on("say",function(data){
				user.says(data);
			});

			//入退室
			socket.on("inout",function(data){
				user.inout(data);
			});
	
			//HottoMotto
			socket.on("motto",function(data){
				user.motto(data);
			});
			
			//IDrequest（返信用）
			socket.on("idrequest",function(data){
				user.idrequest(data);
			});

			//いなくなった
			socket.on("disconnect",function(data){
				user.discon();
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
			sendFirstUsers(socket,true);
		}
	});
	
});
function sendFirstLog(user,callback){
	log.find({},{"sort":[["time","desc"]],"limit":settings.CHAT_FIRST_LOG}).toArray(function(err,docs){
		if(user.socket){
			user.socket.emit("init",{"logs":docs});
		}else if(user.sessionId){
			user.logs=user.logs.concat(docs);
		}
		if(typeof callback=="function")callback();
	});
}
function sendFirstUsers(user,socket_flg){
	var roms=users.filter(function(x){return x.rom}).length, p={
		"users":users.map(function(y){return y.getUserObj()}),
		"roms": roms,
		"actives": users.length-roms
	};
	if(socket_flg){
		user.emit("users",p);
	}else if(user.socket){
		user.socket.emit("users",p);
	}else if(user.sessionId){
		user.userinfos.push({"name":"users","users":p});
	}
}
function addSocketUser(socket){
	var user=new SocketUser(users_next,null,
		  socket.handshake.address.address,true,
		  socket.handshake.headers["user-agent"],
		  socket
		  );
	users.push(user);
	var uob=user.getUserObj();
	socket.broadcast.to("useruser").emit("newuser", uob);
	toapi(function(x){
		x.userinfos.push({"name":"newuser",user:uob});
	});
	users_next++;
	return user;
}
function delUser(user){
	users=users.filter(function(x){return x!=user});
}
function makelog(user,logobj){
	filters.forEach(function(func){
		func(logobj);
	});
	log.insert(logobj,{"safe":true},function(err,docs){
		if(err){
			console.log(err);
			throw err;
		}
	});
	splashlog(logobj,user.socket || getAvailableSocket());
	function splashlog(logobj,socket){
		if(socket){
			socket.emit("log",logobj);
			socket.broadcast.to("chatuser").emit("log",logobj);
		}
		toapi(function(x){x.logs.unshift(logobj)});
	}
}
function toapi(callback){
	users.filter(function(x){return x.sessionId}).forEach(callback);
}

function motto(socket,user,data){
	var time=data.time;
	if(!time)return;
	
	log.find({"time":{$lt:time}},{"sort":[["time","desc"]],"limit":settings.CHAT_MOTTO_LOG}).toArray(function(err,docs){
		var resobj={"logs":docs};
		socket.emit("mottoResponse",resobj);
	});
}
function idrequest(socket,data){
	log.findOne(db.bson_serializer.ObjectID.createFromHexString(data.id),function(err,obj){
		socket.emit("idresponse",obj);
	});
}

//HTTP API
function api(mode,req,res){
	//sessionidを作る
	var query=req.query;
	var sessionId=query.sessionId;
	var user = sessionId ? users.filter(function(x){return x.sessionId==sessionId})[0] : null;
	if(!user){
		sessionId=null;
		while(!sessionId){
			sessionId="";
			for(var i=0;i<settings.CHAT_APIUSER_SESSIONID_LENGTH;i++){
				sessionId+="0123456789abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random()*36)];
			}
			if(users.filter(function(x){return x.sessionId==sessionId}).length)sessionId=null;
		}
		//ROMに追加
		user=new APIUser(users_next,null,
			req.connection.remoteAddress,true,
			req.header("User-Agent"),
			sessionId);
		var socket=getAvailableSocket();
		var uob=user.getUserObj();
		socket && (socket.emit("newuser",uob), socket.broadcast.to("useruser").emit("newuser",uob));
		toapi(function(x){	//pushの前に行おう！
			x.userinfos.push({"name":"newuser",user:uob});
		});
		users.push(user);
		sendFirstUsers(user);
		users_next++;
		req.query.sessionId=sessionId;
		sendFirstLog(user,api.bind(this,mode,req,res));
		return;
	}
	var inoutobj;
	if(mode=="inout"){
		user.inout(query);
		inoutobj=user.getUserObj();
	}else if(mode=="say"){
		user.says(query);
	}else if(mode=="motto"){
		user.motto(query);
		return;
	}else if(mode=="idrequest"){
		user.idrequest(query);
		return;
	}


	var put={"error":false,
		"userinfos":user.userinfos,
		"myid":user.id,
		"logs":user.logs,
		"sessionid":user.sessionId
	};
	if(inoutobj)put.inout=inoutobj;
	res.send(put,{"Content-Type":"text/javascript; charset=UTF-8"});
	
	user.logs.length=0,user.userinfos.length=0;
	user.oxygen();
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
function getAvailableSocket(){
	var su=users.filter(function(x){return x.socket})[0];
	return su ? su.socket : null;
}
