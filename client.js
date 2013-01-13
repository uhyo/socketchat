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
	focusChannel: "",
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
			JSON.parse(localStorage.socketchat_dischannel).forEach(function(ip){this.addDischannel(ip)}.bind(this));
		}
		
		if(localStorage.socketchat_displaynone){
			document.styleSheets[0].insertRule(localStorage.socketchat_displaynone+"{display:none}", 0)
		}

		this.windowb = document.createElement("button");
		this.windowb.addEventListener("click",function(){this.setWindowMode(!this.windowMode);}.bind(this));
		this.setWindowMode(localStorage.soc_highchat_window=="true");
		document.getElementById(this.infobarid).appendChild(this.windowb);
		
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
		document.forms["comment"].elements["channel"].addEventListener("change", function(e){
			this.setFocusChannel(e.target.value);
		}.bind(this));
		
		//フォームを用意
		this.prepareForm();
		this.prepareHottoMottoButton();
		this.line=new HighChatMaker(this,document.getElementById(this.infobarid));
		
		this.loadBot();
	},
	setFocusChannel: function(channel){
		var lastChannel = this.focusChannel;
		if(lastChannel==channel) channel="";
		this.focusChannel = channel;
		if(lastChannel!=""){
			this.removeDischannel(lastChannel, true, true);
		}
		if(channel!=""){
			this.addDischannel(channel, true, true);
		}
		if(document.forms["comment"].elements["channel"].value!=channel) document.forms["comment"].elements["channel"].value = channel;
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
		if(this.flags.sound
				&& this.disip.indexOf(obj.ip)==-1
				&& (!obj.channel 
					|| obj.channel.every(function(ch){return this.dischannel.indexOf(ch)==-1}.bind(this)))){
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
		this.say(f.elements["comment"].value,f.elements["response"].value,f.elements["channel"].value||null);
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
	setWindowMode: function(flag){
		this.windowMode = localStorage.soc_highchat_window = flag;
		this.windowb.textContent = flag ? "窓#" : "欄#";
	},
	windowMode: null,
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
			if(this.windowMode){
				this.openChannel(t.dataset.channel);
			}else{
				this.setFocusChannel(t.dataset.channel);
				document.forms["comment"].elements["comment"].focus();
			}
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
		var _this = this;
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
						
						win.addEventListener("beforeunload",function(){
							_this.removeDischannel(channelname, true, false);
						});
						_this.addDischannel(channelname, true, false);
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
			'#info li[data-ip="'+ip+'"]{text-decoration:line-through}',
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
	addDischannel: function(channel, temporal, anti){
		if(this.dischannel.some(function(x){return x==channel})) return false;

		if(!temporal){
			this.dischannel.push(channel);
			localStorage.socketchat_dischannel=JSON.stringify(this.dischannel);
		}
		this.addCSSRules([
			'#log p'+this.createDisCSS('[data-channel|="'+this.line.createChannelDatasetString(channel)+'"]', temporal, anti),
		]);
		return true;
	},
	removeDischannel: function(channel, temporal, anti){
		if(!temporal){
			this.dischannel=this.dischannel.filter(function(x){
				return x!=channel;
			});
			localStorage.socketchat_dischannel=JSON.stringify(this.dischannel);
		}
		this.removeCSSRules([
			'#log p'+this.createDisSelector('[data-channel|="'+this.line.createChannelDatasetString(channel)+'"]', anti),
		]);
	},
	createDisSelector: function(selector, anti){
		if(anti) selector = ":not("+selector+")";
		return selector;
	},
	createDisCSS: function(selector, temporal, anti){
		return this.createDisSelector(selector, anti)+(temporal ? "{opacity:0.3}" : "{display:none}");
	},
	addCSSRules: function(cssTexts){
		console.log("addCSS", cssTexts);
		if(!(cssTexts instanceof Array)) cssTexts=[cssTexts];
		cssTexts.forEach(function(cssText){
			document.styleSheets.item(0).insertRule(cssText,0);
		});
	},
	removeCSSRules: function(cssSelectors){
		console.log("removeCSS", cssSelectors);
		if(!(cssSelectors instanceof Array)) cssSelectors=[cssSelectors];
		var css=document.styleSheets.item(0);
		for(var i=css.cssRules.length-1; i>=0; i--){
			var rule = css.cssRules[i];
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



