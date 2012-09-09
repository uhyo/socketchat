//通信を管理するオブジェクト
function ChatStream(){
	//EventEmitter（onでlistener登録、emitでイベント発火）
	io.EventEmitter.apply(this);
}
ChatStream.prototype=new io.EventEmitter;
//defaultConnection: デフォルトで使うChatConnectionのコンストラクタ
ChatStream.prototype.init=function(chat,defaultConnection,channel){
	if(!defaultConnection)defaultConnection=ChatConnection;
	this.channel=channel;	//channel名
	this.chat=chat;	//ChatClientオブジェクト
	//ページを更新したときなどの復帰用にsessionid
	this.lastid = this.sessionid = sessionStorage.sessionid || void 0;
	//子供たち(ports) port:MessagePort, channel: (チャンネル名), window:Window
	this.children=[];
	//終了時に子どもも消す
	window.addEventListener("unload",function(ev){
		var c=this.children;
		for(var i=0,l=c.length;i<l;i++){
			c[i].window.close();
		}
	}.bind(this),false);
	//コネクションを初期化
	console.log(this);
	this.initConnection(defaultConnection);
};
ChatStream.prototype.initConnection=function(connfunc){
	var t=this;
	var conn=this.connection=new connfunc();
	conn.init();
	conn.on("sessionid",function(id){
		//sessionidが決まった
		t.setSessionid(id);
	});
	//コネクションの$emitを乗っ取る
	conn._old_$emit=conn.$emit;
	console.log(conn);
	conn.$emit=function(){
		t.$emit.apply(t,arguments);
		//本来の働きをさせる
		conn._old_$emit.apply(conn,arguments);
	};
	//登録
	conn.register(this.lastid,this.channel);
};
ChatStream.prototype.addChild=function(obj){
	//こどもを追加する。メッセージを受けたらこどもにも送る
	this.children.push(obj);
	//メッセージを受け取る
	var t=this;
	var port=obj.port;
	//messageイベントで受け取れる
	port.addEventListener("message",message);

	function message(ev){
		var d=ev.data;
		//メッセージd: {name:(イベント名), args:パラメータ配列}
		if(d.name==="unload"){
			//こどもが閉じられた(emitしない内部メッセージ)
			port.close();
			//子どもの登録を末梢
			t.children.splice(t.children.indexOf(obj),1);
			return;
		}

		var obj1=d.args[0];
		//フィルターをかける
		if(d.name==="find"){
			//サブウィンドウのほうへ流す（関数は送れない）
			//d.args[1]:func
			//motto時はチャンネル限定してあげる
			//if(obj1.motto)obj1.channel=channel;
			t.find(obj1,function(arr){
				//結果を送ってあげる
				port.postMessage({
					name:"findresponse",
					arr:arr,
				});
			});
			return;
		}
		//そしてそのまま流す（自分が発行したイベントと区別しない）
		t.emit.apply(t,[d.name].concat(d.args));
	}
};
ChatStream.prototype.emit=function(name){
	//サーバー側へ送る
	
	//super filter!!!!
	var obj1=arguments[1];
	if(name==="say"){
		//チャネル追加
		console.log(name,this.channel);
		if(this.channel){
			var ch= !obj1.channel? [] : (Array.isArray(obj1.channel) ? obj1.channel : [obj1.channel]);
			if(ch.indexOf(this.channel)<0){
				ch.push(this.channel);//チャンネルに加える
				obj1.channel=ch;
			}
		}
	}else if(name==="find"){
		//motto時はチャンネル限定してあげる
		if(obj1.motto)obj1.channel=this.channel;
	}

	this.connection.emit.apply(this.connection,arguments);
};
ChatStream.prototype.$emit=function(name,obj1){
	//emitするときに内部的に呼ばれる
	var em=io.EventEmitter.prototype.emit;
	//super filter!!!!
	if(name==="log" && this.channel){
		var ch=Array.isArray(obj1.channel) ? obj1.channel : [obj1.channel];
		if(ch.indexOf(this.channel)<0){
			//チャンネルは知らない
			return;
		}
	}

	//本来のemitのはたらき
	em.apply(this,arguments);
	//子供たちにもイベントを送ってあげる
	var c=this.children;
	for(var i=0,l=c.length;i<l;i++){
		//フィルタリングする
		/*if(name==="find"){
			//関数が含まれるのでブロック
			continue;
		}*/
		var port=c[i].port;
		port.postMessage({
			name:name,
			args:Array.prototype.slice.call(arguments,1),
		});
	}

};
ChatStream.prototype.setSessionid=function(id){
	this.sessionid=sessionStorage.sessionid=id;
};
//発言する
ChatStream.prototype.say=function(comment,response,channel){
	//所属チャネルを配列で送る
	if(!channel)channel=[];
	else if(!Array.isArray(channel)){
		channel=[channel];
	}
	/*
	//コメントも配列にする
	var commentArray=[];
	//サロゲートペアは数値にして送る（node.jsが処理できないので）
	var result;
	while(result=comment.match(/^(.*?)([\ud800-\udbff])([\udc00-\udfff])/)){
		//符号位置
		var h=result[2].charCodeAt(0), l=result[3].charCodeAt(0);
		var code=0x10000+(h-0xd800)*0x400+ l-0xdc00;
		if(result[1]){
			commentArray.push(result[1],code);
		}else{
			commentArray.push(code);
		}
		comment=comment.slice(result[0].length);	//処理済みの部分を取り除く
	}
	if(comment){
		//まだ残っている
		commentArray.push(comment);
	}
	if(commentArray.length===1){
		//配列でなくてよい
		commentArray=commentArray[0];
	}
	*/
	//sayイベントを発行
	this.emit("say",{"comment":comment,"response":response?response:"","channel":channel?channel:""});
	
};
//発言をサーバーに問い合わせる
ChatStream.prototype.find=function(query,cb){
	//query:  channel?:"foo", id?:"deadbeef...", motto:{time,until}
	this.connection.emit("find",query,function(arr){
		if(!Array.isArray(arr))cb([]);
		cb(arr);
	});
};
//ユーザーをサーバーに問い合わせる
ChatStream.prototype.users=function(cb){
	//ユーザー一覧をサーバーへ請求する
	this.connection.emit("users",function(obj){
		cb(obj);
	});
};


//実際の通信を担う
function ChatConnection(){
	io.EventEmitter.apply(this);
};
ChatConnection.prototype=new io.EventEmitter;
ChatConnection.prototype.init=function(){
};
//サーバー側へ送る何か
ChatConnection.prototype.emit=function(){
};
//自分とこでイベントを発火させる
ChatConnection.prototype.$emit=function(){
	io.EventEmitter.prototype.emit.apply(this,arguments);
};
ChatConnection.prototype.register=function(){};
//Socket通信
function SocketConnection(){
	ChatConnection.apply(this,arguments);
};
SocketConnection.prototype=new ChatConnection;
SocketConnection.prototype.init=function(){
	var t=this;
	//コネクション
	var socket=this.socket=io.connect(settings.SOCKET_HOST_NAME||(location.protocol+"//"+location.host));
	socket.on("connect",function(){
		//セッションIDを発行してあげる
		t.$emit("sessionid",socket.socket.sessionid);
	});
	socket.on("reconnect",function(){
		//再接続した
		t.register();
	});
	
	//$emitを乗っ取る
	socket._old_$emit=socket.$emit;
	socket.$emit=function(){
		//ソケットで発生したイベントはSocketConnectionでも発生する
		t.$emit.apply(t,arguments);
		//本来の働きをさせる
		socket._old_$emit.apply(socket,arguments);
	};
};
SocketConnection.prototype.emit=function(){
	//ソケットへ送る(自分のとこで発生させるには$emitを使おう）
	this.socket.emit.apply(this.socket,arguments);
};
//登録
SocketConnection.prototype.register=function(lastid,channel){
	this.socket.emit("register",{"mode":"client","lastid":lastid,channel:channel});
};

//メインストリームからもらってくる（チャネルウィンドウ）
function ChildConnection(){
	ChatConnection.apply(this,arguments);
}
ChildConnection.prototype=new ChatConnection;
ChildConnection.prototype.init=function(){
	ChatConnection.prototype.init.apply(this,arguments);
	var t=this;
	this.port=null;
	//親ウィンドウから連絡がくるのを待つ
	window.addEventListener("message",function(ev){
		//メッセージ
		var d=ev.data;
		//通信を確立したい
		if(d.name==="init"){
			//portsにMessagePortが送られてくるのでこれで通信する
			t.port=ev.ports[0];
			if(!t.port){
				throw new Error("no port");
			}
			t.initPort(t.port);
			//準備ができたので伝える
			t.port.postMessage({
				name:"ready",
			});
		}else if(d.name==="ping"){
			d.name="pong";
			//送り返す
			ev.source.postMessage(d,ev.origin);
		}
	},false);
	//クローズを検知して親に伝える
	window.addEventListener("unload",function(ev){
		t.port.postMessage({
			name:"unload",
		});
	},false);
};
//ポート初期化
ChildConnection.prototype.initPort=function(port){
	//ポートが届いた
	var t=this;
	port.start();
	port.addEventListener("message",function(ev){
		var d=ev.data;
		//d.name: event name; d.args: event args;
		//サーバーから届いたメッセージ同様自らにイベントを発生させる）
		t.$emit.apply(t,[d.name].concat(d.args));
	},false);
};
//ストリームへイベント発生要求があった場合
ChildConnection.prototype.emit=function(name){
	//this.$emit.apply(this,arguments);

	//super filter!!!!
	//console.log(name,arguments);
	var p=this.port;
	var query,cb;	//find用
	if(name==="find"){
		query=arguments[1], cb=arguments[2];	//cb:コールバック
		this.port.addEventListener("message",listener);
		if(p){
			p.postMessage({
				name:"find",
				args:[query],
			});
		}
		return;
	}
	if(this.port){
		//ポートへ送る
		this.port.postMessage({
			name:name,
			args:Array.prototype.slice.call(arguments,1),
		});
	}

	//コールバック関数を送れないので帰りもメッセージで
	function listener(ev){
		var d=ev.data;
		if(d.name==="findresponse"){
			cb(d.arr);
			p.removeEventListener("message",listener);
		}
	}
};




