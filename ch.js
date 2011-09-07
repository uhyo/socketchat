var http = require('http'), url = require('url'), fs = require('fs');
var socketio=require('socket.io'),mongodb=require('mongodb');

//定数定義
DB_PORT=27017;
DB_NAME="socketchat";
CHAT_FIRST_LOG=100;	//最初どれだけログ表示するか

var mongoserver = new mongodb.Server("127.0.0.1",DB_PORT,{});
var db = new mongodb.Db(DB_NAME,mongoserver,{});


var httpserver = http.createServer(function(req, res){
	var path = url.parse(req.url).pathname;
	switch (path){
		case '/':
			path='/index.html';
		case '/index.html':
			fs.readFile(__dirname + path, function(err, data){
				if (err) return send404(res);
				res.writeHead(200, {'Content-Type': 'text/html'})
				res.write(data, 'utf8');
				res.end();
			});
			break;
		  "users":users
		default: send404(res);
	}
	function send404(res){
		res.writeHead(404);
		res.write('404');
		res.end();
	}
});

var log,props;
//データベース使用準備
db.open(function(err,_db){
	if(err){
		console.log("DB Open err: "+err);
		throw err;
	}
	db.collection("log",function(err,collection){
		log=collection;
	});
	db.collection("props",function(err,collection){
		props=collection;
	});
});
var users=[],users_next=1;

httpserver.listen(8080);

var io=socketio.listen(httpserver);

io.sockets.on('connection',function(socket){
	sendFirstLog(socket);
	//ユーザー登録
	var user=addUser(socket);

	//発言
	socket.on("say",function(data){
		says(socket,user,data);
	});

	//入退室
	socket.on("inout",function(data){
		inout(socket,user,data);
	});

	//いなくなった
	socket.on("disconnect",function(data){
		delUser(user);
		socket.broadcast.emit("users",{"users":users});
	});
	
});
function sendFirstLog(socket){
	log.find({},{"limit":CHAT_FIRST_LOG,"sort":["time","desc"]}).toArray(function(err,docs){
		socket.emit("init",{"logs":docs});
	});
}
function addUser(socket){
	var user={"id":user_next,
		  "name":null,
		  "rom":true,
		  "ip":socket.handshake.address.address
		  };
	users.push(user);
	socket.broadcast.emit("users",{"users":users});
	return user;
}
function delUser(user){
	users=users.filter(function(x){return x!=user});
}
function says(socket,user,data){
	if(user.rom)return;

	var logobj={"name":user.name,
		    "comment":data.comment,
		    "ip":user.ip,
		    "time":Date.now()
		    };

	log.insert(logobj,{"safe":true},function(err,docs){
		socket.broadcast.emit("log",logobj);
	});
}
function inout(socket,user,data){
	user.rom = !user.rom;
	user.name= user.rom ? null : data.name;

	socket.broadcast.emit("users",{"users":users});
}

