var fs=require('fs');
var socketio=require('socket.io'),mongodb=require('mongodb');

var settings=require('./settings');

exports={};	//default settings
/*exports.DB_SERVER="127.0.0.1";
exports.DB_PORT=27017;
exports.DB_NAME="socketchat";
exports.DB_USER="test";
exports.DB_PASS="test";
exports.HTTP_PORT = 8080;
exports.SOCKET_HOST_NAME = null;
exports.USING_REVERSE_PROXY = true;
*/

exports.CHAT_FIRST_LOG=50;	//最初どれだけログ表示するか
exports.CHAT_MOTTO_LOG=50;	//HottoMotto時デフォルト時にログをどれだけ表示するか

exports.CHAT_MOTTO_MAX_LOG=500;	//1回のHttoMottoで最大どれだけ表示するか

exports.CHAT_NAME_MAX_LENGTH = 25;
exports.CHAT_MAX_LENGTH = 1000;
exports.CHAT_CHANNEL_MAX_LENGTH_SUM = 1000; //data.channelのチャネル名の合計長さの最大

exports.CHAT_LIMIT_TIME = 10;	//0なら無効
exports.CHAT_LIMIT_NUMBER=10;	//CHAT_LIMIT_TIME以内にCHAT_LIMIT_NUMBER回発言したらそれ以上発言できない

exports.CHAT_APIUSER_TIMEOUT = 60;	//APIユーザーがいなくなるまでの時間（秒）
exports.CHAT_APIUSER_SESSIONID_LENGTH = 20;

exports.CHAT_BURY_TIMEOUT = 120;	//ユーザーdeadから消滅までの猶予
exports.CHAT_SOCKETUSER_TIMEOUT = 5;	//socketユーザーがいなくなるまでの時間
for(var i in exports){
	if(!settings[i]){
		settings[i]=exports[i];
		console.log("settings: "+i+" is not defined.");
	}
}


var mongoserver = new mongodb.Server(settings.DB_SERVER,settings.DB_PORT,{});
var db = new mongodb.Db(settings.DB_NAME,mongoserver,{});


//var app = require('express').createServer();
var express=require('express');
var app=express();

//fonts
app.use('/fonts',express.static(__dirname+"/fonts"));
//css
app.use('/css',express.static(__dirname+"/css"));

app.get(/^\/(index\.html)?$/, function(req, res){
	res.sendfile(__dirname + '/clients/index.html');
});
/*app.get(/^\/(log|list|apiclient|com|smp|ts|smpjump)(\.js)?$/, function(req, res){
	res.sendfile(__dirname + "/"+req.params[0]+'.'+(req.params[1]?'js':'html'));
});*/
app.get(/^\/((?:line|connection|client|firefoxapp)\.js|(sound|jihou)\.(mp3|wav|ogg)|manifest\.webapp)$/, function(req, res){
	res.sendfile(__dirname + "/"+req.params[0]);
});
//for client ts
app.get(/^\/ts\/(.+\.js)$/, function(req,res){
	res.sendfile(__dirname + "/ts/"+req.params[0]);
});

app.get(/^\/settings.js$/, function(req, res){
	res.charset="UTF-8";
	res.type("text/javascript");
	res.send("settings="+JSON.stringify({SOCKET_HOST_NAME:settings.SOCKET_HOST_NAME}));
});
app.get('/chalog', function(req, res){
	chalog(req.query,function(resobj){
		res.charset="UTF-8";
		res.type("text/javascript");
		res.send(resobj);
	});
});
/*
app.get(/^\/api\/(.*)$/, function(req,res){
	api(req.params[0],req,res);
});
*/
app.get('/show', function(req, res){
	res.send({
		users: users,
		users_next: users_next,
		users_s: users_s
	},{"Content-Type":"text/javascript; charset=UTF-8"});
});
//クライアントを探す
app.get(/^\/([^\/]+)$/,function(req,res){
	var filename=__dirname+'/clients/'+req.params[0]+'.html';
	fs.exists(filename,function(result){
		if(result){
			res.sendfile(__dirname + '/clients/'+req.params[0]+'.html');
		}else{
			res.send(404);
		}
	});
});

//httpでラップ
var srv=require('http').createServer(app);
srv.listen(settings.HTTP_PORT);

var io=socketio.listen(srv);
io.set('log level',1);
var log, chcoll;
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
			db.collection("channel",function(err,collection){
				chcoll=collection;
				var syslog={"name" : "■起動通知",
					"time":new Date(),
				"ip":"127.0.0.1",
				"comment":"「サーバー」さんが起動",
				"syslog":true
				};
				makelog({"type":"system"},syslog);
			});
		});
	});
});
var users=[],users_next=1;
var dead=[];	//棺桶

var users_s={};

var filters=[];

//拡張
//Forwarded For
filters.push(function(logobj,user){
	if(!user)return;
	if(user.xff && user.xff.length>0){
		logobj.ipff=user.xff.join(",");
	}
});
//hito-maru-gogo
/*filters.push(function(logobj){
	var tms=["まる","ひと","ふた","さん","よん","GO!","ろく","なな","はち","きゅう"];
	var date=new Date(logobj.time);
	if(date.getMinutes()==55){
		var h=date.getHours();
		var com=tms[h/10|0]+tms[h%10]+"☆GO!GO!";
		var add={"name":"span","attributes":{},"style":{"font-size":"2em"},"child":com};
		logobj.comment=pushLogobj(logobj.comment,add);
	}
});*/
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
"ら":"ﾗ", "り":"ﾘ", "る":"ﾙ", "れ":"ﾚ", "ろ":"ﾛ", "わ":"ﾜ", "ゎ":"ﾜ", "を":"ｦ", "ん":"ﾝ",
"ゔ":"ｳﾞ","ヷ":"ﾜﾞ", "ヰ":"ｲ", "ヸ":"ｲﾞ","ヹ":"ｴﾞ","ヺ":"ｦﾞ","ー":"ｰ", "ゕ":"ｶ","ゖ":"ｹ",
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
		}).replace(/((?:ｦ\uFF9E?)+|[ｧ-ｮｱ-\uFF9F]+)/g,function(katakanas){	//\uFF9F: 半角半濁点
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


function User(id,name,ip,rom,ua,xff){
	//xff: [ip,ip,...]
	this.id=id,this.name=name,this.ip=ip,this.rom=rom,this.ua=ua,this.xff=xff;
	
	this.ss=[];	//最近の発言
}
User.prototype.getUserObj=function(){
	//外部出力用
	return {"id":this.id,"name":this.name,"ip":this.ip,"rom":this.rom,"ua":this.ua,"xff":this.xff};
};
User.prototype.type="user";
//says,inout
User.prototype.says=function(data){
	if(this.rom)return;
	if(!data || !data.comment)return;
	//連続発言
	if(settings.CHAT_LIMIT_TIME>0){
		var d=Date.now()-1000*settings.CHAT_LIMIT_TIME;
		if((this.ss=this.ss.filter(function(x){return x>=d})).length>=settings.CHAT_LIMIT_NUMBER){
			//喋りすぎ
			return;
		}
		this.ss.push(Date.now());
	}

	if("string"!==typeof data.comment && !Array.isArray(data.comment))return;
	//console.log(data);
	//ログを生成する
	var length, commentString;	//コメントの長さ、文字列バージョン
	try{
		length=0;	//足していく
		//ログを生成
		/*commentString="";
		   commentObj=(function check(comment){
			if("string"===typeof comment && comment.length>0){
				length+=comment.length;
				commentString+=comment;
				return comment;
			}else if(Array.isArray(comment)){
				var result=[];
				var lastUnicodeObj=null;	//U+10000以上の文字を表すオブジェクト
				for(var i=0, l=comment.length;i<l;i++){
					var r=check(comment[i]);
					if(r.name==="#x-unicode"){
					   if(lastUnicodeObj){
						//前のやつに組み入れる
						lastUnicodeObj.code=lastUnicodeObj.code.concat(r.code);
					   }else{
						   result.push(r);
						   lastUnicodeObj=r;
					   }
					}else{
						result.push(r);
						lastUnicodeObj=null;
					}
				}
				return result;
			}else if("number"===typeof comment){
				if(comment<0x10000 || 0x10ffff<comment){
					//サポート範囲外
					throw new Error;
				}
				length++;
				//復元して文字列にも入れる（壊れるけど）
				//サロゲートペアを復元
				var l=(number & 0x3ff)+0xdc00;
				var h=((number-0x10000)>>10)+0xd800;
				commentString+=String.fromCharCode(h)+String.fromCharCode(l);
				return {
					name:"#x-unicode",
					code:[comment],
				};
			}
			throw new Error;
		})(data.comment);*/
		commentString=(function check(comment){
			if("string"===typeof comment && comment.length>0){
				length+=comment.length;
				return comment;
			}else if(Array.isArray(comment)){
				var result="";
				for(var i=0, l=comment.length;i<l;i++){
					result+=check(comment[i]);
				}
				return result;
			}else if("number"===typeof comment){
				if(comment<0x10000 || 0x10ffff<comment){
					//サポート範囲外
					throw new Error;
				}
				length++;
				//復元して文字列にも入れる（壊れるけど）
				//サロゲートペアを復元
				var l=(comment & 0x3ff)+0xdc00;
				var h=((comment-0x10000)>>10)+0xd800;
				return String.fromCharCode(h)+String.fromCharCode(l);
			}
			throw new Error;
		})(data.comment);

	}catch(e){
		return;
	}

				
	if(length>settings.CHAT_MAX_LENGTH || length===0){
		return;
	}

	var channel=[];
	if(data.channel){
		//チャンネル
		var c=data.channel;
		if(Array.isArray(c)){
			//配列だった
			if(c.length===0){
				//channel=null;
			}else if(c.length===1){
				c=c[0];	//文字列化
				channel.push(c);
			}else{
				//全部採用
				channel=c;
			}
		}else if('string' === typeof c){
			channel.push(c);
		}
		//チャネルをチェックする
		if(!channel.every(validateHashtag)){
			//だめ
			return;
		}
	}
	if(channel.map(function(c){return c.length;}).reduce(function(a,b){return a+b;},0)>exports.CHAT_CHANNEL_MAX_LENGTH_SUM){
		return;
	}
	//console.log(commentString);
	//発言中のハッシュタグを処理
	var save_str=comment=commentString;	//とっておく
	//コメントからチャネルを探す
	var flag=false, result;
	while(result=comment.match(/(?:^|\s+)#(\S+)\s*$/)){
		//文末のハッシュタグはチャネルに組み入れる
		if(channel.indexOf(result[1])<0 && validateHashtag(result[1])){
			channel.unshift(result[1]);
			comment=comment.slice(0,comment.length-result[0].length);	//その部分をカット
			flag=true;
		}
		//不適なチャネルだった
		break;
	}
	if(flag && /^\s*$/.test(comment)){
		//空っぽになってしまった場合は戻す
		comment=save_str;
	}
	//文末以外のチャンネルを割り当てる
	/*result=comment.match(/(?:^|\s+)#\S+/g);
	if(result){
		for(var i=0,l=result.length;i<l;i++){
			var r=result[i].match(/#(\S+)$/);
			var hash=r[1];	//チャンネル名
			if(hash && channel.indexOf(hash)<0){
				channel.push(hash);
			}
		}
	}*/
	var sliced=comment;
	while(sliced){
		//チャネルを探す
		var result;
		if(sliced.charAt(0)==="#"){
			//チャネルだ
			result=sliced.match(/^#([^#\s]+)/);
			if(result){
				//階層に分ける
				var chs=result[1].split("/");
				var inx=chs.indexOf("");
				//空のがあったらそこは不適
				if(inx>=0){
					chs=chs.slice(0,inx);	//空の前まで
				}
				var ch=chs.join("/");
				if(chs.length>0 && validateHashtag(ch)){
					//これは正しいチャネルだ
					channel.push(ch);
				}
			}
		}
		//このブロックの処理は終わった
		result=sliced.match(/^\S*\s*/);
		if(result){
			sliced=sliced.slice(result[0].length);
		}
	}
	//チャネルの処理
	if(channel.length===0){
		channel=null;
	}

	var logobj={"name":this.name,
		    "comment":comment,
		    "ip":this.ip,
		    "time":new Date()
		    };

	if(channel)logobj.channel=channel;	//チャネルを追加
	var say=makelog.bind(null,this,logobj);
	if(data.response){
		try{
			log.findOne(db.bson_serializer.ObjectID.createFromHexString(data.response),function(err,obj){
				if(obj){
					logobj.response=data.response;
					say();
				}
			}.bind(this));
		}catch(e){
		}
	}else{
		say();
	}
	


	//makelog(this,logobj);
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
		    "time":new Date(),
		    "ip":this.ip,
		    "comment":"「"+this.name+"」さんが"+(this.rom?"退室":"入室"),
		    "syslog":true
	};
	makelog(this,syslog);
	if(this.rom)this.name=null;
	
	this.inoutSplash();

};
User.prototype.inoutSplash=function(){
/*	var socket = this.socket || getAvailableSocket(), obj={"rom":this.rom, id: this.id, name: this.name};
	socket && (socket.emit("inout",obj), socket.broadcast.to("useruser").emit("inout",obj));
	toapi(function(x){
		x==this || x.userinfos.push({"name":"inout","user":obj});
	}.bind(this));*/
};
//何か探してあげる
function findlog(query,callback){
	if(!query){
		callback([]);
		return;
	}
	var q={};
	var one_flag=false;
	var number=parseInt(query.number) || settings.CHAT_MOTTO_LOG;
	if(query.channel){
		q.channel=new RegExp("^"+query.channel.replace(/(\W)/g,"\\$1")+"(/.*)?$");
	}
	if(query.motto){
		//time:この時間より前 until:この時間まで
		var m=query.motto;
		q.time={$lt:new Date(m.time)};
		if(m.until){
			q.time.$gte=new Date(m.until);
			//最大までにしてあげる
			if(!query.number)number=settings.CHAT_MOTTO_MAX_LOG;
		}
	}
	number=Math.min(number, settings.CHAT_MOTTO_MAX_LOG);
	if(query.id){
		one_flag=true;
		if(query.id.length!=24 && query.id.length!=12){
			callback([]);
			return;
		}
		q=db.bson_serializer.ObjectID.createFromHexString(query.id);
	}

	if(one_flag){
		//1件
		log.findOne(q,function(err,obj){
			callback([obj]);
		});
	}else{
		log.find(q,{"sort":[["time","desc"]],"limit":number}).toArray(function(err,arr){
			if(err){
				callback({error:err});
			}else{
				callback(arr);
			}
		});
	}
};
//いなくなった！❾
User.prototype.discon=function(){
	if(!this.rom){
		var syslog={"name" : "■失踪通知",
			    "time":new Date(),
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


function SocketUser(id,name,ip,rom,ua,xff,socket){
	User.apply(this,arguments);
	this.socket=socket;
	
	this.timerid=null;
}
SocketUser.prototype=new User;
SocketUser.prototype.type="socket";
SocketUser.prototype.inoutSplash=function(){
	var obj=this.getUserObj();
	this.socket.emit("userinfo",obj), this.socket.emit("inout",obj), this.socket.broadcast.to("useruser").emit("inout",obj);
	toapi(function(x){
		x==this || x.userinfos.push({"name":"inout","user":obj});
	}.bind(this));
};

function APIUser(id,name,ip,rom,ua,xff,sessionId){
	User.apply(this,arguments);
	this.sessionId=sessionId;
	
	this.logs=[];
	
	this.userinfos=[];
	
	this.timerid=null;
	this.lastreq=null;
}
APIUser.prototype=new User;
APIUser.prototype.type="api";
APIUser.prototype.oxygen=function(){
	clearTimeout(this.timerid);
	this.timerid=setTimeout(this.discon.bind(this),1000*settings.CHAT_APIUSER_TIMEOUT);
};
APIUser.prototype.inoutSplash=function(){
	var obj={"rom":this.rom, id: this.id, name: this.name};
	var socket=getAvailableSocket();
	if(socket)socket.emit("inout",obj), socket.broadcast.to("useruser").emit("inout",obj);
	toapi(function(x){
		x==this || x.userinfos.push({"name":"inout","user":obj});
	}.bind(this));
};

io.sockets.on('connection',function(socket){
	//ユーザー登録
	var user=null;
	socket.on("register",function(data){
		if(!data)return;
		if(data.mode=="client"){
			//チャットクライアント
			socket.join("chatuser");
			socket.join("useruser");
			user=addSocketUser(socket,data.lastid);
			sendFirstLog(user,data.channel || void 0);
			sendFirstUsers(user);

			//発言
			socket.on("say",function(data){
				user.says(data);
			});

			//入退室
			socket.on("inout",function(data){
				user.inout(data);
			});
	
			//ユーザー情報
			socket.on("users",function(func){
				//即返す
				if("function"===typeof func){
					func(getUsersData());
				}
			});
			

			//いなくなった
			socket.on("disconnect",function(data){
				user.timerid=setTimeout(function(){
					user.discon();
				},settings.CHAT_SOCKETUSER_TIMEOUT*1000);
			});
		}else if(data.mode=="userlist"){
			//ユーザーリスト
			socket.join("useruser");
			sendFirstUsers(socket,true);
		}
		if(data.mode=="client" || data.mode=="chalog"){
			//Chalog
			socket.on("query",function(data){
				chalog(data,function(resobj){
					socket.emit("result",resobj);
				});
			});
			//ログ検索
			socket.on("find",function(query,func){
				if("function"===typeof func){
					findlog(query,func);
				}
			});
		}
	});
	
});
function sendFirstLog(user,channel,callback){
	var query={};
	if(channel)query.channel=channel;
	log.find(query,{"sort":[["time","desc"]],"limit":settings.CHAT_FIRST_LOG}).toArray(function(err,docs){
		if(user.socket){
			user.socket.emit("init",{"logs":docs});
		}else if(user.sessionId){
			user.logs=user.logs.concat(docs);
		}
		if(typeof callback=="function")callback();
	});
}
function sendFirstUsers(user,socket_flg){
	var p=getUsersData();
	if(socket_flg){
		user.emit("users",p);
	}else if(user.socket){
		user.socket.emit("users",p);
	}else if(user.sessionId){
		user.userinfos.push({"name":"users","users":p});
	}
}
function getUsersData(){
	var roms=users.filter(function(x){return x.rom}).length, p={
		"users":users.map(function(y){return y.getUserObj()}),
		"roms": roms,
		"actives": users.length-roms
	};
	return p;
}
function addSocketUser(socket,lastid){
	var zombie=dead.filter(function(x){return x.socket && x.socket.id===lastid})[0];
	var user, zombie_rom;
	user=users.filter(function(x){return x.socket && x.socket.id===lastid && x.timerid})[0];
	if(user && !user.rom){
		//音もなく復帰
		clearTimeout(user.timerid);
		user.timerid=null;
		user.socket=socket;
		var obj={"rom":user.rom, id: user.id, name: user.name};
		socket.emit("userinfo",obj);
		return user;
	}
	if(zombie){
		user=zombie;
		zombie.socket=socket;
		zombie.ip=socket.handshake.address.address;
		zombie.ua=socket.handshake.headers["user-agent"];
		zombie_rom=zombie.rom;
		zombie.rom=true;
	}else{
		//新規
		var xffstr=socket.handshake.headers["x-forwarded-for"];
		var xff=[], ip=socket.handshake.address.address;
		if(xffstr){
			xff=xffstr.split(",").map(function(ip){
				return ip.replace(/\s/g,"");
			});
			if(settings.USING_REVERSE_PROXY){
				//リバースプロキシを使っている場合はipが127.0.0.1になるはずなので捨てる
				ip=xff.pop();
			}
		}
		user=new SocketUser(users_next,null,
			ip,true,
			socket.handshake.headers["user-agent"],
			xff,
			socket
		);
	}
	users.push(user);
	var uob=user.getUserObj();
	socket.broadcast.to("useruser").emit("newuser", uob);
	toapi(function(x){
		x.userinfos.push({"name":"newuser",user:uob});
	});
	users_next++;
	if(zombie && !zombie_rom){
		//自動入室
		zombie.inout({name:zombie.name});
	}else{
		//情報を送ってあげる
		var obj={"rom":user.rom, id: user.id, name: user.name};
		socket.emit("userinfo",obj);
	}
	return user;
}
function delUser(user){
	dead.push(user);
	users=users.filter(function(x){return x!=user});
	setTimeout(function(){
		dead=dead.filter(function(x){return x!=user});
	},settings.CHAT_BURY_TIMEOUT*1000);
}
function makelog(user,logobj){
	filters.forEach(function(func){
		func(logobj,user);
	});
	if("string"!==typeof logobj.comment){
		//コメントがオブジェクトでない場合
		//ここでstringに変換、commentObjectを新設
		logobj.commentObject=logobj.comment;
		logobj.comment=stringify(logobj.commentObject);
	}
	log.insert(logobj,{"safe":true},function(err,docs){
		if(err){
			console.log(err);
			throw err;
		}
	});
	if(logobj.channel){
		var channels={}; //重複を除くため
		logobj.channel.forEach(function(c){
			var str="";
			c.split("/").forEach(function(token){
				str+=token;
				channels[str]=1;
				str+="/";
			});
		});
		for(var ch in channels){
			incrementChannel(ch)
		}
	}
	splashlog(logobj,user.socket || getAvailableSocket());
	function splashlog(logobj,socket){
		if(socket){
			socket.emit("log",logobj);
			socket.broadcast.to("chatuser").emit("log",logobj);
		}
		toapi(function(x){x.logs.unshift(logobj)});
	}
	//オブジェクト交じりcommentを文字列のみに変換
	function stringify(obj){
		if("string"===typeof obj){
			return obj;
		}else if(Array.isArray(obj)){
			//配列は全部連結する
			return obj.map(stringify).join("");
		}else{
			//オブジェクト
			return stringify(obj.child);
		}
	}
	function incrementChannel(channel){
		console.log("inc",channel)
		chcoll.findOne({_id:channel}, function(err,obj){
			if(obj){
				obj.count++
				chcoll.save(obj);
			}else{
				chcoll.insert({_id:channel, count:1});
			}
		});
	}
}
function toapi(callback){
	users.filter(function(x){return x.type=="api"}).forEach(callback);
}

//HTTP API
function api(mode,req,res){
	//検索
	if(mode==="find"){
		var q;
		try{
			q=JSON.parse(req.query.query);
		}catch(e){
			reply({error:true},400);
			return;
		}
		findlog(q,function(logs){
			reply(logs);
		});
		return;
	}else if(mode==="users"){
		//ユーザー一覧の請求
		reply(getUsersData());
		return;
	}else if(mode=="hashtag"){
		if(!req.query.query){
			reply({error:true},400);
			return;
		}
		searchHashtag(req.query.query,function(tags){
			reply(tags);
		});
		return;
	}
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
		var ip=req.connection.remoteAddress, xff=[], xffstr;
		if(xffstr=req.header("x-forwarded-for")){
			xff=xffstr.split(",").map(function(ip){
				return ip.replace(/\s/g,"");
			});
			if(settings.USING_REVERSE_PROXY){
				//127
				ip=xff.pop();
			}
		}
		user=new APIUser(users_next,null,
			ip,true,
			req.header("User-Agent"),
			xff,
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
		sendFirstLog(user,null,api.bind(this,mode,req,res));
		return;
	}
	user.lastreq=req;
	var inoutobj;
	if(mode=="inout"){
		user.inout(query);
		inoutobj=user.getUserObj();
	}else if(mode=="say"){
		user.says(query);
	}
	var put={"error":false,
		"userinfos":user.userinfos,
		"userinfo":user.getUserObj(),
		"logs":user.logs,
		"sessionid":user.sessionId
	};
	if(inoutobj)put.inout=inoutobj;
	reply(put);
	
	user.logs.length=0,user.userinfos.length=0;
	user.oxygen();

	//返答する
	function reply(resp,status){
		if("object"===typeof resp){
			res.json(resp,{"Content-Type":"application/json; charset=UTF-8","Access-Control-Allow-Origin":"*"},status);
		}else{
			res.send(resp,{"Content-Type":"text/plain; charset=UTF-8","Access-Control-Allow-Origin":"*"},status);
		}
	}
}


function chalog(query,callback){
	var page=parseInt(query.page) || 0;
	var value=parseInt(query.value) || 500;
	if(value>5000)value=5000;
	
	var queryobj={};
	
	var optobj={"sort":[["time","desc"]]};
	if(page)optobj.skip=page*value;
	optobj.limit=value;
	
	var std=new Date(query.starttime);
	if(!isNaN(std.getTime())){
		queryobj.time={$gte:std};
	}
	var end=new Date(query.endtime);
	if(!isNaN(end.getTime())){
		if(queryobj.time){
			queryobj.time["$lte"]=end;
		}else{
			queryobj.time={$lte:end};
		}
	}
	if(query.name){
		//一致
		queryobj.name=new RegExp(query.name.replace(/(\W)/g,"\\$1")+"(@.*)?$");
	}
	if(query.ip){
		//一致
		queryobj.ip=query.ip;
	}
	if(query.comment){
		//服務
		queryobj.comment=new RegExp(query.comment.replace(/(\W)/g,"\\$1"));
	}
	if(query.channel){
		queryobj.channel = new RegExp("^"+query.channel.replace(/(\W)/g,"\\$1")+"(/.*)?$");
	}
	
	var result=log.find(queryobj,optobj).toArray(function(err,docs){
		var resobj={"logs":docs};
		
		callback(resobj);
		
	});
}
function searchHashtag(tag,callback){
	//一致
	var regexp = new RegExp("^"+tag.replace(/(\W)/g,"\\$1"));
	chcoll.find({_id:regexp}).sort({count:-1}).toArray(function(err,docs){
		callback({tags:docs});
	});
}
function getAvailableSocket(){
	var su=users.filter(function(x){return x.socket})[0];
	return su ? su.socket : null;
}
//ハッシュタグをチェックする
function validateHashtag(channel){
	if("string"!==typeof channel)return false;
	if(channel==="")return false;
	//スペースや#を含んではいけない
	if(/\s|#/.test(channel))return false;
	//スラッシュで始まらない
	if(/^\//.test(channel))return false;
	//スラッシュで終わらない
	if(/\/$/.test(channel))return false;
	//スラッシュが連続しない
	if(/\/\//.test(channel))return false;
	//OK!
	return true;
}
