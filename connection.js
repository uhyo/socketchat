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




//チャットクライアント
function ChatClient(log,info,infobar){
	//logid, infoid, infobarid : それぞれのid
	this.logid=log,this.infoid=info,this.infobarid=infobar;
	
	this.oldest_time=null;	//持っているもっとも古いログ
	this.flags={"sound":true};
}
ChatClient.prototype={
	//使用するChatStream
	useConnection:function(){return ChatConnection},
	getStream:function(channel,child){
		var s= new ChatStream();
		//child: こどもフラグ
		var connection= child ? ChildConnection : this.useConnection();
		s.init(this,connection, channel);
		return s;
	},
	init:function(){
		this.me={
			//自分の情報
			name:null,
			rom:null,
		};
		this.log=document.getElementById(this.logid);
		this.log.textContent="";
		this.info=document.getElementById(this.infoid);
		this.users=this.info.getElementsByClassName("users")[0];
		this.usernumber=this.info.getElementsByClassName("usernumber")[0];
		
		this.bots=[];
		this.disip=[];	//IP list
		if(localStorage.socketchat_disip){
			JSON.parse(localStorage.socketchat_disip).forEach(this.addDisip.bind(this));
		}
		this.dischannel=[];	//channel list
		if(localStorage.socketchat_dischannel){
			JSON.parse(localStorage.socketchat_dischannel).forEach(this.addDischannel.bind(this));
		}
		
		if(localStorage.socketchat_displaynone){
			document.styleSheets[0].insertRule(localStorage.socketchat_displaynone+"{display:none}", 0)
		}

		
		this.responding_to=null;	//dd
		
		//getAudio,setVolume用
		this.audioCollection=[];
		//Audio
		if(this.flags.sound){
			this.audio=this.getAudio("/sound");
		}
		var jihou = this.jihou = this.getAudio("/jihou");
		var nextJihou = new Date();
		nextJihou.setHours(2);
		nextJihou.setMinutes(0);
		nextJihou.setSeconds(0);
		nextJihou.setMilliseconds(0);
		var sabun = nextJihou.getTime()-(new Date()).getTime();
		if(sabun<0)sabun+=86400000;
		//console.log(sabun);
		setTimeout(function(){jihou.play()}, sabun)
		
		//Responding tip(クリックすると右側に出るやつ）
		this.responding_tip=document.createElement("span");
		this.responding_tip.textContent="⇒";
		this.responding_tip.classList.add("responding_tip");
		
		//通信部分初期化
		var channel,child;	//child: 子どもフラグ
		if(location.hash){
			//チャンネルだ!!
			channel=location.hash.slice(1);	//先頭の#を除く
			document.title += " #"+channel;
		}
		if(sessionStorage.independent_flag==="true"){
			//親から通信がくるぞ!
			child=true;
			delete sessionStorage.independent_flag;
		}
		this.cominit(channel,child);
		
		
		/*document.forms["inout"].addEventListener("submit",this.submit.bind(this),false);
		document.forms["comment"].addEventListener("submit",this.submit.bind(this),false);*/
		//console.log("init!");
		//フォーム送信
		document.addEventListener("submit",this.submit.bind(this),false);
		
		this.log.addEventListener('click',this.click.bind(this),false);
		this.info.addEventListener('click', function(e){
			var t = e.target.parentNode;
			if(t.tagName=="LI" && t.dataset.ip){
				if(!this.addDisip(t.dataset.ip)){
					this.removeDisip(t.dataset.ip);
				}
			}
		}.bind(this));
		
		//フォームを用意
		this.prepareForm();
		this.prepareHottoMottoButton();
		this.line=new HighChatMaker(this,document.getElementById(this.infobarid));
		
		this.loadBot();
	},
	//HottoMottoボタン初期化
	prepareHottoMottoButton:function(){
		var hottomottob=document.getElementsByClassName("logs")[0].getElementsByClassName("hottomottobutton")[0];
		hottomottob.addEventListener("click",function(e){this.HottoMotto()}.bind(this),false);
	},
	//フォーム準備
	prepareForm:function(){
		if(localStorage.socketchat_name){
			document.forms["inout"].elements["uname"].value=localStorage.socketchat_name;
		}
	},
	//channel: 属するチャネル名 child: 子どもかどうか
	cominit:function(channel,child){	
		//通信部分初期化
		var stream;
		//socket=this.socket = io.connect(settings.SOCKET_HOST_NAME||location.origin);
		var con;	//コンストラクタ

		this.stream=stream=this.getStream(channel,child);

		//ストリームに対しイベントを登録
		stream.on("init",this.loginit.bind(this));
		stream.on("log",this.recv.bind(this));
		stream.on("users",this.userinit.bind(this));
		stream.on("userinfo",this.userinfo.bind(this));
		stream.on("disconnect",this.disconnect.bind(this));
		stream.on("newuser",this.newuser.bind(this));
		stream.on("deluser",this.deluser.bind(this));
		stream.on("inout",this.inout.bind(this));
		stream.on("reconnect",this.reconnect.bind(this));

	},
	//初期化情報が届いた logs:現在のログ
	loginit:function(data){
		//console.log("loginit",data,this.oldest_time);
		data.logs.reverse().forEach(function(line){
			this.write(line);
		},this);
		if(data.logs.length){
			this.oldest_time=data.logs.shift().time;
		}
	},
	//ログを受信した
	recv:function(obj){
		this.bots.forEach(function(func){func(obj,this)},this);
		if(this.flags.sound){
			this.audio.play();
		}
		this.write(obj);
	},
	//ログを追加
	write:function(obj){
		this.log.insertBefore(this.line.make(obj),this.log.firstChild);
	},
	//誰かが来た
	newuser: function(user){
		//console.log("newuser", user);
		var li=document.createElement("li");
		var sp=document.createElement("span");
		sp.textContent=user.name;
		sp.title=user.ip+" / "+user.ua;
		li.dataset.id=user.id;
		li.dataset.ip=user.ip;
		if(user.rom){
			li.classList.add("rom");
			//rom+1
			this.setusernumber(0, 1);
		}else{
			//active+1
			this.setusernumber(1, 0);
		}
		
		li.appendChild(sp);
		this.users.appendChild(li);
		//console.log("newuser out");
	},
	//そのユーザーidを表すエレメントをusersから探す
	getuserelement: function(id){
		var ul=this.users.childNodes;
		for(var i=0, l=ul.length; i<l; i++){
			if(ul[i].dataset && ul[i].dataset.id==id){
				return ul[i];
			}
		}
		return null;
	},
	//誰かがお亡くなりに
	deluser: function(id){
		//console.log("deluser", id);
		var elem=this.getuserelement(id);
		if(!elem) return;
		
		//そのユーザーの要素を削除
		var actives=this.usernumber.dataset.actives, roms=this.usernumber.dataset.roms;
		if(elem.classList.contains("rom")){
			//rom-1
			this.setusernumber(0, -1);
		}else{
			//active-1
			this.setusernumber(-1, 0);
		}
		this.users.removeChild(elem);
	},
	//最初にユーザリストが送られてきた
	userinit:function(obj){
		//console.log("userinit", obj);
		while(this.users.firstChild)this.users.removeChild(this.users.firstChild);//textNode消す
		
		this.usernumber.dataset.actives=this.usernumber.dataset.roms=0;
		obj.users.forEach(this.newuser, this);
		//this.setusernumber(obj.actives, obj.roms);
	},
	//人数をセットして反映
	setusernumber: function(actives, roms){
		//actives, roms: それぞれの増減
		var dataset=this.usernumber.dataset;
		dataset.actives=parseInt(dataset.actives)+actives;
		dataset.roms=parseInt(dataset.roms)+roms;
		this.usernumber.textContent="入室"+dataset.actives+(dataset.roms!=0? " (ROM"+dataset.roms+")":"");
	},
	//誰かが入退室
	inout: function(obj){
		//console.log("inout", obj);
		//obj.id, obj.name, obj.rom
		var elem=this.getuserelement(obj.id);
		if(!elem)return;
		elem.firstChild.textContent=obj.name;
		if(obj.rom){
			elem.classList.add("rom");
			//active-1, rom+1
			this.setusernumber(-1, 1);
		}else{
			elem.classList.remove("rom");
			//active+1,rom-1
			this.setusernumber(1, -1);
		}
	},
	//自分が入退室したときにサーバー側から情報がくる
	userinfo:function(obj){
		//console.log("userinfo",obj);
		//自分の名前とrom状態
		this.me={
			name:obj.name,
			rom:obj.rom,
		};
		var f=document.forms["inout"];
		if(f){
			//入室フォームがある場合はそこを変える
			f.elements["uname"].disabled=!obj.rom;
			if(!obj.rom)f.elements["uname"].value=obj.name;
		
			//入室ボタンの文字を変える
			var result=document.evaluate('descendant::input[@type="submit"]',f,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null);
			var bt=result.singleNodeValue;
			bt.value=obj.rom?"入室":"退室";
		}
		if(!obj.refresh)this.inout(obj);
	},
	//mottoボタンを押したとき until:時間指定
	HottoMotto:function(until){
		this.stream.find({
			"motto":{
				time:this.oldest_time,
				until:until || void 0,
			}
		},function(logs){
			logs.forEach(function(line){
				this.log.appendChild(this.line.make(line));
			},this);
			if(logs.length)this.oldest_time=logs.pop().time;
		}.bind(this));
	},
	
	//フォームが送信されたとき
	submit:function(e){
		var f=e.target;
		if(f.name=="inout"){
			//入退室
			var el=f.elements["uname"];
			this.inout_notify(el.value);
			
			localStorage.socketchat_name=el.value;
		}else if(f.name=="comment"){
			//発言
			var el=f.elements["comment"];
			this.sayform(f);
			el.value="";
			f.elements["response"].value="";
			this.responding_tip.parentNode && this.responding_tip.parentNode.removeChild(this.responding_tip);
		}
		e.preventDefault();
	},
	//入退室をサーバーに伝える
	inout_notify:function(name){
		//サーバーに入室を伝える
		this.stream.emit("inout",{"name":name});
	},
	
	//フォームをもとに発言
	sayform:function(f){
		this.say(f.elements["comment"].value,f.elements["response"].value);
	},
	//発言をサーバーに伝える
	say:function(comment,response,channel){
		this.stream.say(comment,response,channel);
	},
	
	bot:function(func){
		this.bots.push(func);
	},
	saveBot: function(){
		localStorage.socketchat_bot="["+this.bots.map(function(func){
			return func.toString();
		}).join(",")+"]";
	},
	loadBot: function(){
		try{
			this.bots=eval(localStorage.socketchat_bot)||[];
		}catch(e){}
	},
	//クリック
	click:function(e){
		var t=e.target;
		if(t===this.responding_tip){
			//返信チップ
			//イベント伝播ストップ（何で必要なんだろう）
			e.stopPropagation();
			
			document.forms["comment"].elements["response"].value=this.responding_tip.dataset.to;
			document.forms["comment"].elements["comment"].focus();
			this.responding_tip.classList.add("checked");
			//console.log(document.forms["comment"]);
			return;
		}else if(t.classList.contains("channel")&&t.dataset.channel){
			//チャンネルだ
			this.openChannel(t.dataset.channel);
			return;
		}
		//ログをクリックしたとき
		var dd=document.evaluate('ancestor-or-self::p',t,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null).singleNodeValue;
		if(!dd){

			//返信チップ消す
			this.responding_tip.parentNode && this.responding_tip.parentNode.removeChild(this.responding_tip);
			return;
		}
		//返信先を開く
		if(dd.classList.contains("respto") && dd.dataset.open!="open"){
			this.responding_to=dd;
			//this.socket.emit("idrequest",{"id":dd.dataset.respto});
			//サーバーへ返信先のログを要求
			this.stream.find({"id":dd.dataset.respto},function(arr){
				var data=arr[0];
				var line=this.line.make(data);
				var bq=document.createElement("blockquote");
				bq.classList.add("resp");
				bq.appendChild(line);

				//もとのログの直後に追加
				dd.parentNode.insertBefore(bq,dd.nextSibling);
			}.bind(this));
			dd.dataset.open="open";
			return;
		}
		//コメント
		this.responding_tip.classList.remove("checked");

		if(document.forms["comment"])document.forms["comment"].elements["response"].value="";
		dd.appendChild(this.responding_tip);
		this.responding_tip.dataset.to=dd.dataset.id;
	},
	//サーバーから切断されたとき
	disconnect:function(){
		document.body.classList.add("discon");
	},
	//復帰した時
	reconnect: function(){
		document.body.classList.remove("discon");
		this.clearLog();
		//this.stream.register();
	},
	//サブチャンネルをオープンする
	openChannel:function(channelname){
		sessionStorage.independent_flag="true";	//子ウィンドウに対して子ウィンドウであることを知らせる
		var win=window.open(location.pathname+"#"+channelname);
		//delete sessionStorage.independent_flag;
		//まず通信を確立する
		var wait=100, count=0;
		var timerid=null;
		var t=this;
		window.addEventListener("message",listener);
		ping();
		function ping(){
			//送る（帰ってきたら向こうが受付開始したとみなせる）
			win.postMessage({
				name:"ping",
			},"*");
			//console.log(++count);
			//次のpingを用意
			timerid=setTimeout(ping,wait);
		}
		//pongリスナ
		function listener(ev){
			var d=ev.data;
			//console.log("recv",d);
			if(d.name==="pong"){
				//データが帰ってきた
				clearTimeout(timerid);
				window.removeEventListener("message",listener);
				//情報を送る(MessageChannel: port1とport2がつながっている）
				var channel=new MessageChannel();
				channel.port1.start();
				channel.port1.addEventListener("message",function ls(ev){
					var d=ev.data;
					if(d.name==="ready"){
						//通信準備ができた
						channel.port1.removeEventListener("message",ls);
						//ストリームに子として登録
						t.stream.addChild({
							port:channel.port1,
							window:win,
						});
						t.initChild(channel.port1,channelname);
						//このタイミングで削除
						delete sessionStorage.independent_flag;
					}
				});

				win.postMessage({
					name:"init",
				},"*",[channel.port2]);

			}
		}
	},
	initChild:function(port,channelname){
		//子供に最初のメッセージを送る（サーバーを模倣した感じ）
		//initメッセージ
		var t=this;
		//ログを持ってくる
		this.stream.find({
			channel:channelname,
		},function(arr){
			send("init",{logs:arr});
		});
		//ユーザー情報
		this.stream.users(function(obj){
			send("users",obj);
			send("userinfo",{
				name:t.me.name,
				rom:t.me.rom,
			});
		});

		function send(name,obj){
			if(Array.isArray(obj)){
				port.postMessage({
					name:name,
					args:obj,
				});
			}else{
				port.postMessage({
					name:name,
					args:[obj],
				});
			}
		}
	},
	clearLog: function(){
		while(this.log.firstChild)this.log.removeChild(this.log.firstChild);
	},
	getAudio: function(filename){
		var audio;
		try{
			audio=new Audio();
			audio.removeAttribute("src");
			["ogg", "mp3", "wav"].forEach(function(ext){
				//source要素：複数候補を指定できる（再生できるものを再生）
				var source=document.createElement("source");
				source.src=filename+"."+ext;
				source.type="audio/"+ext;
				audio.appendChild(source);
			});
			this.audioCollection.push(audio);
		}catch(e){
			//オーディオなんてなかった　ダミーを用意
			audio={play:function(){}};
		}
		return audio;
	},
	setVolume: function(volume){
		//ボリュームをセット
		for(var i=0,l=this.audioCollection.length;i<l;i++){
			this.audioCollection[i].volume=volume;
		}
	},
	addDisip: function(ip, temporal){
		if(this.disip.some(function(x){return x==ip})) return false;
		if(!temporal){
			this.disip.push(ip);
			localStorage.socketchat_disip=JSON.stringify(this.disip);
		}
		this.addCSSRules([
			'#log p[data-ip="'+ip+'"]{display:none}',
			'#info li[data-ip="'+ip+'"]{font-style:italic}',
		]);
		return true;
	},
	removeDisip: function(ip, temporal){
		if(!temporal){
			this.disip=this.disip.filter(function(x){
				return x!=ip;
			});
			localStorage.socketchat_disip=JSON.stringify(this.disip);
		}
		this.removeCSSRules([
			'#log p[data-ip="'+ip+'"]',
			'#info li[data-ip="'+ip+'"]',
		]);
	},
	addDischannel: function(channel, temporal){
		if(this.dischannel.some(function(x){return x==channel})) return false;
		if(!temporal){
			this.dischannel.push(channel);
			localStorage.socketchat_dischannel=JSON.stringify(this.dischannel);
		}
		this.addCSSRules([
			'#log p[data-channel*="#'+channel+'#"]{display:none}',
		]);
		return true;
	},
	removeDischannel: function(channel, temporal){
		if(!temporal){
			this.dischannel=this.dischannel.filter(function(x){
				return x!=channel;
			});
			localStorage.socketchat_dischannel=JSON.stringify(this.dischannel);
		}
		this.removeCSSRules([
			'#log p[data-channel*="#'+channel+'#"]',
		]);
	},
	addCSSRules: function(cssTexts){
		if(!(cssTexts instanceof Array)) cssTexts=[cssTexts];
		cssTexts.forEach(function(cssText){
			console.log(cssText)
			document.styleSheets.item(0).insertRule(cssText,0);
		});
	},
	removeCSSRules: function(cssSelectors){
		if(!(cssSelectors instanceof Array)) cssSelectors=[cssSelectors];
		var css=document.styleSheets.item(0);
		for(var i=css.cssRules.length-1; i>=0; i--){
			var rule = css.cssRules[i];
			console.log(rule.cssText);
			if(cssSelectors.indexOf(rule.selectorText)>=0){
				css.deleteRule(i);
			}
		}
	},
};

function SocketChat(){
	ChatClient.apply(this,arguments);
}
SocketChat.prototype=new ChatClient;
SocketChat.prototype.useConnection=function(){
	return SocketConnection;
};
/*SocketChat.prototype.HottoMotto=function(e,until){
	if(until){
		this.stream.emit("motto",{"time":this.oldest_time,"until":until});
	}else{
		this.stream.emit("motto",{"time":this.oldest_time});
	}
};*/



