//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {

  Function.prototype.bind = function (oThis) {

    if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;

  };

}

function LineMaker(parent){
	this.parent=parent;
}
LineMaker.prototype={
	make:function(obj){
		var df=document.createElement("p");
		var color=this.getColor(obj.ip);
		var dt=el("span",obj.name);
		if(obj.syslog)dt.classList.add("syslog");
		dt.classList.add("name");
		df.style.color=color;
		
		df.appendChild(dt);
		var dd=el("span","");
		dd.classList.add("main");
		var comsp=document.createElement("span");
		comsp.classList.add("comment");
		comsp.appendChild(commentHTMLify(obj.comment));
		dd.appendChild(comsp);
		var infsp=el("span","(");
		infsp.classList.add("info");
		var date=new Date(obj.time);
		var dat=date.getFullYear()+"-"+zero2(date.getMonth()+1)+"-"+zero2(date.getDate()), tim=zero2(date.getHours())+":"+zero2(date.getMinutes())+":"+zero2(date.getSeconds());
		var time=el("time",dat+" "+tim);
		time.datetime=dat+"T"+tim+"+09:00";
		
		df.dataset.id=obj._id;
		if(obj.response){
			df.dataset.respto=obj.response;
			df.classList.add("respto");
		}
	
		infsp.appendChild(time);
		infsp.appendChild(document.createTextNode(", "+obj.ip+")"));
		dd.appendChild(infsp);
		dd.style.color=color;
		df.appendChild(dd);
		return df;

		function el(name,text){
			var ret=document.createElement(name);
			ret.textContent=text;
			return ret;
		}
		function zero2(str){
			return ("00"+str).slice(-2);
		}
		function commentHTMLify(comment){
			if(typeof comment=="object"){
				if(comment instanceof Array){
					var df=document.createDocumentFragment();
					comment.forEach(function(x){
						df.appendChild(commentHTMLify(x));
					});
					return df;
				}else{
					var elm=document.createElement(comment.name);
					for(var i in comment.attributes){
						elm.setAttribute(i,comment.attributes[i]);
					}
					for(var i in comment.style){
						elm.style.setProperty(i,comment.style[i],null);
					}
					elm.appendChild(commentHTMLify(comment.child));
					return elm;
				}
			}else{
				return document.createTextNode(comment);
			}
		}
	},
	getColor:function(ip){
		var arr=ip.split(/\./);
		return "rgb("+Math.floor(parseInt(arr[0])*0.75)+", "+
		Math.floor(parseInt(arr[1])*0.75)+", "+
		Math.floor(parseInt(arr[2])*0.75)+")";
	},
}


function HighChatMaker(parent,infobar){
	this.parent=parent;
	this.gyoza1_on=null;	//mouseoverがonになっているか
	this.gyozas=["餃子無展開","餃子オンマウス","餃子常時"];
	this.infobar=infobar;
	if(!infobar){
		this.infobar=document.createElement("div");
	}
	this.init();

	this.setGyoza(localStorage.soc_highchat_gyoza ? localStorage.soc_highchat_gyoza : 0);
	
}
HighChatMaker.prototype=new LineMaker();
HighChatMaker.prototype.init=function(){
	//infobar
	//while(this.infobar.firstChild)this.infobar.removeChild(this.infobar.firstChild);
	
	this.gyozab=document.createElement("button");
	this.gyozab.textContent=this.gyozas[this.gyoza];
	this.gyozab.classList.add("gyozainfo");
	
	this.gyozab.addEventListener("click",this.gyozabutton.bind(this),false);
	this.infobar.appendChild(this.gyozab);
	
	//audio
	var audioc=this.audioc=document.createElement("input");
	audioc.type="range",audioc.min=0,audioc.max=100,audioc.step=10;
	audioc.value = (localStorage.soc_highchat_audiovolume!=undefined ? localStorage.soc_highchat_audiovolume : (localStorage.soc_highchat_audiovolume=50));
	if(this.parent && this.parent.audio)this.parent.audio.volume=audioc.value/100;
	audioc.addEventListener("change",function(e){
		console.log(audioc.value,this.parent.audio);
		if(audioc.checkValidity() && this.parent.audio)this.parent.audio.volume=(localStorage.soc_highchat_audiovolume=audioc.value)/100;
	}.bind(this),false);
	this.infobar.appendChild(audioc);
};
HighChatMaker.prototype.make=function(obj){
	var df=LineMaker.prototype.make.apply(this,arguments);
	var parse=_parse.bind(this);
	var allowed_tag=["s","small"];
	
	var dd=df.childNodes.item(1);
	parse(dd);
	return df;
	
	function _parse(node){
		if(node.nodeType==Node.TEXT_NODE){
			//テキストノード
			if(!node.parentNode)return;
			var result=document.createDocumentFragment();
			while(node.nodeValue){
				//開始タグ
				var res=node.nodeValue.match(/^\[(\w+?)\]/);
				if(res){
					if(allowed_tag.indexOf(res[1])<0){
						//そんなタグはないよ！
						node=node.splitText(res[0].length);
						continue;
					}
					var span=document.createElement("span");
					span.classList.add(res[1]);
					span.textContent=node.nodeValue.slice(res[0].length);
					if(!span.textContent){
						node=node.splitText(res[0].length);
						continue;
					}
					node.parentNode.replaceChild(span,node);
					node=span.firstChild;
					continue;
				}
				//終了タグ
				res=node.nodeValue.match(/^\[\/(\w+?)\]/);
				if(res){
					if(allowed_tag.indexOf(res[1])<0){
						//そんなタグはないよ！
						node=node.splitText(res[0].length);
						continue;
					}
					//閉じるべきタグを探す
					var p=node;
					while(p=p.parentNode){
						if(p.classList && p.classList.contains(res[1])){
							break;
						}
					}
					if(p){
						//タグを閉じる
						node.nodeValue=node.nodeValue.slice(res[0].length);
						p.parentNode.appendChild(node);
					}else{
						node=node.splitText(res[0].length);
						continue;
					}
					continue;
				}
				//リンク
				res=node.nodeValue.match(/^https?:\/\/\S+/);
				if(res){
					var res2=res[0].match(/^http:\/\/gyazo\.com\/([0-9a-f]{32})(?:\.png)?/);
					if(res2){
						//Gyazo
						var a=document.createElement("a");
						a.target="_blank";
						a.href="http://gyazo.com/"+res2[1]+".png";
						a.classList.add("gyoza");
						if(this.gyoza==2){
							//餃子常時展開
							var img=document.createElement("img");
							img.classList.add("thumbnail");
							img.hidden=true;
							a.appendChild(img);
							var temp_node=document.createTextNode("[Gyoza...]");
							a.appendChild(temp_node);
							img.addEventListener('load',function(e){
								a.removeChild(temp_node);
								img.hidden=false;
							},false);
							img.src="http://gyazo.com/thumb/"+res2[1]+".png";							
						}else{
							a.textContent="[Gyazo]";
						}
						node=node.splitText(res2[0].length);
						node.parentNode.replaceChild(a,node.previousSibling);
						continue;
					}
					var res2=res[0].match(/^http:\/\/myazo\.net(?:\:81|\:80)?\/data\/([0-9a-f]{32})(?:\.png)?/);
					if(res2){
						//Gyazo
						var a=document.createElement("a");
						a.target="_blank";
						a.href="http://myazo.net:81/data/"+res2[1]+".png";
						/*a.classList.add("gyoza");
						if(this.gyoza==2){
							//餃子常時展開
							var img=document.createElement("img");
							img.src="http://img.gyazo.com/a/"+res2[1]+".png";
							img.classList.add("thumbnail");
							a.appendChild(img);
						}else{
							a.textContent="[Gyazo]";
						}*/
						a.textContent="[Myazo]";
						node=node.splitText(res2[0].length);
						node.parentNode.replaceChild(a,node.previousSibling);
						continue;
					}else{
						var a=document.createElement("a");
						a.href=res[0];
						a.target="_blank";
						a.textContent=res[0];
						node=node.splitText(res[0].length);
						node.parentNode.replaceChild(a,node.previousSibling);
					}
					continue;
				}
				//正男リンク
				res=node.nodeValue.match(/^#(\d{4})/);
				if(res){
					var a=document.createElement("a");
					a.target="_blank";
					a.href="http://81.la/"+res[1];
					a.textContent=res[0];
					node=node.splitText(res[0].length);
					node.parentNode.replaceChild(a,node.previousSibling);
					continue;
				}
				//その他
				res=node.nodeValue.match(/^(.+?)(?=\[\/?\w+?\]|https?:\/\/|#\d{4})/)
				if(res){
					node=node.splitText(res[0].length);
					continue;
				}
				node=node.splitText(node.nodeValue.length);
//				throw new Error("parse failed");
				
				
			}
		}else if(node.childNodes){
			var nodes=[];
			for(var i=0,l=node.childNodes.length;i<l;i++){
				nodes.push(node.childNodes[i]);
			}
			nodes.forEach(function(x){
				if(x.parentNode.isSameNode(node))
					parse(x);
			});
		}
	}
};
HighChatMaker.prototype.setGyoza=function(gyoza){
	this.gyoza=localStorage.soc_highchat_gyoza=gyoza%this.gyozas.length;
	this.gyozab.textContent=this.gyozas[this.gyoza];

	if(this.gyoza==1 && !this.gyoza1_on){
		this.gyoza1_on=this.gyozamouse.bind(this);
		document.addEventListener("mouseover",this.gyoza1_on,false);
	}else if(this.gyoza!=1 && this.gyoza1_on){
		document.removeEventListener("mouseover",this.gyoza1_on,false);
		this.gyoza1_on=null;
	}
};
HighChatMaker.prototype.gyozabutton=function(e){
	this.setGyoza(this.gyoza+1);
};
HighChatMaker.prototype.gyozamouse=function(e){
	var t=e.target;
	if(t.classList.contains("gyoza")){
		var result=t.href.match(/^http:\/\/gyazo\.com\/([0-9a-f]{32})\.png$/);
		if(!result)return;
		var img=document.createElement("img");
		img.src="http://gyazo.com/thumb/"+result[1]+".png";
		
		img.addEventListener("load",ev,false);
		img.style.display="none";
		t.textContent="[Gyoza...]";
		t.appendChild(img);
	}
	
	function ev(e){
		t.removeChild(t.firstChild);
		img.style.display="";
	}
};


function ChatClient(log,info,infobar){
	this.logid=log,this.infoid=info,this.infobarid=infobar;
	
	this.oldest_time=null;
	this.flags={"sound":true};
}
ChatClient.prototype={
	init:function(){
		this.log=document.getElementById(this.logid);
		this.info=document.getElementById(this.infoid);
		this.users=this.info.getElementsByClassName("users")[0];
		this.usernumber=this.info.getElementsByClassName("usernumber")[0];
		
		this.usernumber.dataset.actives=this.usernumber.dataset.roms=0;
		this.bots=[];
		
		this.responding_to=null;	//dd
		
		//Audio
		if(this.flags.sound){
			var audio;
			var soundSource=[
				["./sound.ogg", "audio/ogg"],
				["./sound.mp3", "audio/mp3"],
				["./sound.wav", "audio/wav"]
			];
			try{
				audio=new Audio();
				audio.removeAttribute("src");
				soundSource.forEach(function(arr){
					var source=document.createElement("source");
					source.src=arr[0];
					source.type=arr[1];
					audio.appendChild(source);
				});
			}catch(e){
				audio={play:function(){}};
			}
			this.audio=audio;
		}
		
		//Responding tip
		this.responding_tip=document.createElement("span");
		this.responding_tip.textContent="⇒";
		this.responding_tip.classList.add("responding_tip");
		
		this.cominit();
		
		
		/*document.forms["inout"].addEventListener("submit",this.submit.bind(this),false);
		document.forms["comment"].addEventListener("submit",this.submit.bind(this),false);*/
		document.addEventListener("submit",this.submit.bind(this),false);
		
		this.log.addEventListener('click',this.click.bind(this),false);
		
		this.prepareForm();
		this.prepareHottoMottoButton();
		this.line=new HighChatMaker(this,document.getElementById(this.infobarid));
		
	},
	//HottoMottoボタン初期化
	prepareHottoMottoButton:function(){
		var hottomottob=document.getElementsByClassName("logs")[0].getElementsByClassName("hottomottobutton")[0];
		hottomottob.addEventListener("click",this.HottoMotto.bind(this),false);
	},
	//フォーム準備
	prepareForm:function(){
		if(localStorage.socketchat_name){
			document.forms["inout"].elements["uname"].value=localStorage.socketchat_name;
		}
	},
	cominit:function(){	
		//通信部分初期化
	},
	loginit:function(data){
		console.log("loginit",data,this.oldest_time);
		if(sessionStorage){
			if(this.socket){
				sessionStorage.socketid=this.socket.socket.sessionid;
			}else{
				sessionStorage.sessionid=this.sessionId;
			}
		}
		data.logs.reverse().forEach(function(line){
			this.write(line);
		},this);
		if(data.logs.length){
			this.oldest_time=data.logs.shift().time;
		}
	},
	recv:function(obj){
		this.bots.forEach(function(func){func(obj,this)},this);
		if(this.flags.sound){
			this.audio.play();
		}
		this.write(obj);
	},
	write:function(obj){
		this.log.insertBefore(this.line.make(obj),this.log.firstChild);
	},
	//誰かが来た
	newuser: function(user){
		console.log("newuser", user);
		var li=document.createElement("li");
		var sp=document.createElement("span");
		sp.textContent=user.name;
		sp.title=user.ip+" / "+user.ua;
		li.dataset.id=user.id;
		if(user.rom){
			li.classList.add("rom");
			this.setusernumber(0, 1);
		}else{
			this.setusernumber(1, 0);
		}
		
		li.appendChild(sp);
		this.users.appendChild(li);
		console.log("newuser out");
	},
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
		console.log("deluser", id);
		var elem=this.getuserelement(id);
		if(!elem) return;
		
		var actives=this.usernumber.dataset.actives, roms=this.usernumber.dataset.roms;
		if(elem.classList.contains("rom")){
			this.setusernumber(0, -1);
		}else{
			this.setusernumber(-1, 0);
		}
		this.users.removeChild(elem);
		console.log("deluser out");
	},
	//最初にユーザリストを得る
	userinit:function(obj){
		console.log("userinit", obj);
		while(this.users.firstChild)this.users.removeChild(this.users.firstChild);//textNode消す
		
		obj.users.forEach(this.newuser, this);
		//this.setusernumber(obj.actives, obj.roms);
	},
	//人数をセットして反映
	setusernumber: function(actives, roms){
		var dataset=this.usernumber.dataset;
		dataset.actives=parseInt(dataset.actives)+actives;
		dataset.roms=parseInt(dataset.roms)+roms;
		this.usernumber.textContent="入室"+dataset.actives+(dataset.roms!=0? " (ROM"+dataset.roms+")":"");
	},
	//誰かが入退室
	inout: function(obj){
		console.log("inout", obj);
		var elem=this.getuserelement(obj.id);
		if(!elem)return;
		elem.firstChild.textContent=obj.name;
		if(obj.rom){
			elem.classList.add("rom");
			this.setusernumber(-1, 1);
		}else{
			elem.classList.remove("rom");
			this.setusernumber(1, -1);
		}
		console.log("inout out");
	},
	//自分が入退室
	userinfo:function(obj){
		console.log("userinfo",obj);
		var f=document.forms["inout"];
		if(f){
			f.elements["uname"].disabled=!obj.rom;
			if(!obj.rom)f.elements["uname"].value=obj.name;
		
			var result=document.evaluate('descendant::input[@type="submit"]',f,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null);
			var bt=result.singleNodeValue;
			bt.value=obj.rom?"入室":"退室";
		}
		if(!obj.refresh)this.inout(obj);
	},
	mottoResponse:function(data){
		data.logs.forEach(function(line){
			this.log.appendChild(this.line.make(line));
		},this);
		if(data.logs.length)this.oldest_time=data.logs.pop().time;
	},
	
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
	inout_notify:function(name){},
	
	sayform:function(f){
		this.say(f.elements["comment"].value,f.elements["response"].value);
	},
	say:function(comment,response){
	},
	
	bot:function(func){
		this.bots.push(func);
	},
	click:function(e){
		var t=e.target;
		if(t.isSameNode(this.responding_tip)){
			e.stopPropagation();
			
			document.forms["comment"].elements["response"].value=this.responding_tip.dataset.to;
			document.forms["comment"].elements["comment"].focus();
			this.responding_tip.classList.add("checked");
			console.log(document.forms["comment"]);
			return;
		}
		var dd=document.evaluate('ancestor-or-self::p',t,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null).singleNodeValue;
		if(!dd){

			this.responding_tip.parentNode && this.responding_tip.parentNode.removeChild(this.responding_tip);
			return;
		}
		if(dd.classList.contains("respto") && dd.dataset.open!="open"){
			//開く
			this.responding_to=dd;
			this.socket.emit("idrequest",{"id":dd.dataset.respto});
			dd.dataset.open="open";
			return;
		}
		//コメント
		this.responding_tip.classList.remove("checked");

		if(document.forms["comment"])document.forms["comment"].elements["response"].value="";
		dd.appendChild(this.responding_tip);
		this.responding_tip.dataset.to=dd.dataset.id;
	},
	idresponse:function(data){
		if(!this.responding_to || !data)return;
		var line=this.line.make(data);
		var bq=document.createElement("blockquote");
		bq.classList.add("resp");
		bq.appendChild(line);

		var r=this.responding_to;
		r.parentNode.insertBefore(bq,r.nextSibling);
		
	},
	disconnect:function(){
		document.body.classList.add("discon");
	}
};

function SocketChat(){
	ChatClient.apply(this,arguments);
}
SocketChat.prototype=new ChatClient;
SocketChat.prototype.cominit=function(){
	var socket;
	socket=this.socket = io.connect(location.origin);
	
	socket.on("init",this.loginit.bind(this));
	socket.on("log",this.recv.bind(this));
	socket.on("users",this.userinit.bind(this));
	socket.on("userinfo",this.userinfo.bind(this));
	socket.on("mottoResponse",this.mottoResponse.bind(this));
	socket.on("idresponse",this.idresponse.bind(this));
	socket.on("disconnect",this.disconnect.bind(this));
	socket.on("newuser",this.newuser.bind(this));
	socket.on("deluser",this.deluser.bind(this));
	socket.on("inout",this.inout.bind(this));

	socket.emit("regist",{"mode":"client","lastid":sessionStorage.socketid});
	
};
SocketChat.prototype.inout_notify=function(name){
	this.socket.emit("inout",{"name":name});
};
SocketChat.prototype.say=function(comment,response){
	this.socket.emit("say",{"comment":comment,"response":response?response:""});
};
SocketChat.prototype.HottoMotto=function(e){
	this.socket.emit("motto",{"time":this.oldest_time});
};

function APIChat(){
	ChatClient.apply(this,arguments);
	
	this.sessionId=null;
	this.timerId=null;
	
	this.users={};
}
APIChat.prototype=new ChatClient;
APIChat.prototype.send=function(path,query,callback){
	var http=new XMLHttpRequest();
	if(!query)query={};
	
	http.onreadystatechange = function(){
		if(this.readyState==4 && this.status==200){
			callback(JSON.parse(this.responseText));
		}
	};
	var res=[];
	for(var i in query){
		res.push(encodeURIComponent(i)+"="+encodeURIComponent(query[i]));
	}
	if(this.sessionid){
		res.push("sessionId="+this.sessionid);
	}else if(sessionStorage.sessionid){
		res.push("sessionId="+sessionStorage.sessionid);
	}
	http.open("get",path+(res.length? "?"+res.join("&"):""),true);
	http.send();
};
APIChat.prototype.cominit=function(){
	this.timerId=setInterval(this.check.bind(this),10000);
	this.check();
};
APIChat.prototype.response=function(obj){
	if(obj.error){
		console.log(obj.errormessage);
		return;
	}
	if(!this.oldest_time){
		this.loginit(obj);
	}else{
		obj.logs.reverse().forEach(function(x){
			this.recv(x);
		},this);
		if(obj.sessionid)sessionStorage.sessionid=this.sessionid=obj.sessionid;
	}
	
	if(obj.inout){
		this.userinfo(obj.inout);
	}
	obj.userinfos.forEach(function(x){
		switch(x.name){
		case "newuser":
			this.newuser(x.user);
			break;
		case "deluser":
			this.deluser(x.id);
			break;
		case "inout":
			this.inout(x.user);
			break;
		case "users":
			this.userinit(x.users);
			break;
		}
	},this);
	
};
APIChat.prototype.check=function(){
	this.send("/api/",null,this.response.bind(this));
};
APIChat.prototype.inout_notify=function(name){
	this.send("/api/inout",{"name":name},this.response.bind(this));
};
APIChat.prototype.say=function(comment,response){
	this.send("/api/say",{"comment":comment,"response":response},this.response.bind(this));
};
APIChat.prototype.HottoMotto=function(){
	this.send("/api/motto",{"time":this.oldest_time},function(data){
		console.log(data);
		this.mottoResponse(data)
	}.bind(this));
//	this.send("/api/motto",{"time":this.oldest_time},this.mottoResponse.bind(this));
};

//コマンドライン風
function CommandLineChat(log,info,con){
	var infobar=document.createElement("div");
	infobar.id="aaaaaaaaa____aa_a_a_a_a_a_a_a___aa_a";
	SocketChat.call(this,log,info,infobar.id);
	
	this.consoleid=con;
	this.cmode="down";	//新しいログは上へ
	
	this.commandlog=[];	// コマンド履歴
	this.commandlogindex=null;	//basho
	
	this.process=null;	//プロセス数
//	this.accept=true;//プロセスの入力

	this.isrom=null;	//ROMかどうか
}
CommandLineChat.prototype=new SocketChat;
CommandLineChat.prototype.prepareHottoMottoButton=function(){};
CommandLineChat.prototype.prepareForm=function(){};
CommandLineChat.prototype.init=function(){
	SocketChat.prototype.init.apply(this);
	
	
	this.console=document.getElementById(this.consoleid);
	this.consoleo=this.console.getElementsByClassName("consoleoutput")[0];
	this.command=document.createElement("input");
	var p=document.createElement("p");
	this.commandtopelement=document.createElement("span");
	this.commandtopelement.textContent="> ";
	p.appendChild(this.commandtopelement);
	p.appendChild(this.command);
	if(this.cmode=="up"){
		//上へ進む
		this.console.insertBefore(p,this.consoleo);
	}else{
		this.console.appendChild(p);
	}
	this.console.addEventListener("click",function(e){
		this.cfocus();
	}.bind(this),false);
	if(localStorage.consoleheight)this.setConsoleHeight();
	
	// コンソール環境
	var focus=false;
	
	document.addEventListener("keydown",keydown.bind(this),false);
	this.command.addEventListener("focus",function(){focus=true},false);
	this.command.addEventListener("blur",function(){focus=false},false);
	
	//移動用フォーム
	this.form=document.createElement("form");
	this.form.method="get";
	this.form.target="_blank";
	
	function keydown(e){
		if(this.process && this.process.key){
			if(!this.process.key(e))return;
		}
		if(this.process && !this.process.key)return;
		if(e.keyCode==13 || e.keyCode==27){
			//Enter,Esc
			if(!this.console.classList.contains("open")){
				//開く
				this.openConsole();
			}else if(this.command.value==""){
				this.closeConsole();
				return;
			}
		}
		if(e.keyCode==13 && !this.process){
			this.doCommand(this.command.value);
			this.command.value="";
			this.cfocus();
			return;
		}
/*		if(focus && this.process>0 && !this.accept){
			e.preventDefault();
			return;
		}*/
		if(focus && (e.keyCode==38 || e.keyCode==40)){
			//上下
			if(this.commandlogindex==null){
				this.commandlogindex=this.commandlog.length-1;
			}else if(e.keyCode==38){
				this.commandlogindex--;
				if(this.commandlogindex<0)this.commandlogindex=0;
			}else{
				this.commandlogindex++;
				if(this.commandlogindex>=this.commandlog.length)this.commandlogindex=this.commandlog.length-1;
			}
			if(this.commandlog[this.commandlogindex]){
				this.command.value=this.commandlog[this.commandlogindex];
			}
		}
	}
};
CommandLineChat.prototype.openConsole=function(){
	this.console.classList.add("open");
	this.cfocus();
};
CommandLineChat.prototype.closeConsole=function(){
	this.console.classList.remove("open");
	this.command.blur();
};
CommandLineChat.prototype.doCommand=function(str){
	var result;
	var syschar=localStorage.syschar || "\\";
	result=str.match(new RegExp("^\\"+syschar+"(\\S+)(?:\\s+)?"));
	if(!result){
		//通常の発言
		this.say(str);
		return;
	}
	//履歴
	this.commandlog.push(str);
	this.commandlogindex=null;
	
	this.cprint("> "+str);
	str=str.slice(result[0].length);
	if(!this.commands[result[1]]){
		this.cprint(result[1]+": No such command");
		return;
	}
	this.commands[result[1]](new CommandLineChat.Process(this,str));
	
	
};
CommandLineChat.prototype.chideinput=function(){
	this.command.disabled=true;
	this.command.parentNode.hidden=true;
};
CommandLineChat.prototype.copeninput=function(topstr){
	if(topstr!=null){
		this.commandtopelement.textContent=topstr ? topstr+" " : "";
	}
	this.command.disabled=false;
	this.command.parentNode.hidden=false;

};
CommandLineChat.Process=function(chat,arg){
	this.chat=chat;
	this.arg=arg;
	
	this.chat.chideinput();
	
	chat.process=this;
}
CommandLineChat.Process.prototype={
	//スペース区切り
	parse:function(str,maxlen){
		var ret=[],result;
		if(!maxlen)maxlen=1/0;
		while(str && ret.length+1<maxlen){
			result=str.match(/^\s*([^\"\s]+)\s*/);
			if(result){
				ret.push(result[1]);
				str=str.slice(result[0].length);
				continue;
			}
			result=str.match(/^\s*\"((?:\\\"|[^\"])+)\"\s*/);
			if(result){
				ret.push(result[1].replace("\\\"","\""));
				str=str.slice(result[0].length);
				continue;
			}
			break;
		}
		if(str){
			ret.push(str);
		}
		return ret;
	},
	//出力
	put:function(str){
		this.chat.cprint(str);
	},
	print:function(str){
		this.chat.cprint(str);
	},
	//行削除
	deletelines:function(num){
		for(var i=0;i<num;i++){
			this.chat.consoleo.textContent=this.chat.consoleo.textContent.replace(/.*\n?$/,"");
		}
	},
	//入力
	input:function(cb){
		//複数行対応
		this.chat.copeninput("");
		var result=""
		//入力
		this.key=function(e){
			if(e.keyCode==13){
				//Shift+Enter
				this.print(this.chat.command.value);
				result+=this.chat.command.value+"\n";
				this.chat.command.value="";
				this.chat.cfocus();
				if(!e.shiftKey){
					//終了
					this.chat.chideinput();
					this.key=null;
					cb(result);
				}
			}
		}.bind(this);
	},
	//キーひとつ trueを返すと続行
	getkey:function(cb){
		this.chat.copeninput("");
		this.key=function(e){
			e.preventDefault();
			if(!cb(e)){
				//this.chat.chideinput();
				this.key=null;
			}
			return false;
		}.bind(this);
	},
	//終了
	die:function(chat){
		this.chat.process=null;
		this.chat.copeninput(">");
	},
};

CommandLineChat.prototype.commands=(function(){
	var obj={};
	obj["in"]=function(process){
		if(!process.chat.isrom){
			process.print("You are already in the room.");
			process.die();
			return;
		}
		var str;
		if(str=process.arg){
			localStorage.socketchat_name=str;
		}
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.out=function(process){
		if(process.chat.isrom){
			process.print("You are not in the room.");
			process.die();
			return;
		}
		var str;
		if(str=process.arg){
			localStorage.socketchat_name=str;
		}
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.motto=function(process){
		process.chat.HottoMotto();
		process.die();
	};
	obj.volume=function(process){
		if(process.arg){
			var vo=parseInt(process.arg);
			if(isNaN(vo) || vo<0 || 100<vo){
				process.print("volume: invalid volume "+process.arg);
			}else{
				localStorage.soc_highchat_audiovolume=vo;
				process.chat.audio.volume=vo/100;
			}
		}else{
			process.print(localStorage.soc_highchat_audiovolume);
		}
		process.die();
		
	};
	obj.set=function(process){
		var args=process.parse(process.arg,2);
		switch(args[0]){
		case "syschar":case "systemchar":	//命令文字
			if(args[1].length!=1){
				process.print("set "+args[0]+": invalid char "+args[1]);
				break;
			}
			localStorage.syschar=args[1];
			break;
		case "height":	//コンソール高さ
			if(isNaN(args[1]) || parseInt(args[1])<0){
				process.print("set "+args[0]+": invalid value "+args[1]);
				break;
			}
			localStorage.consoleheight=args[1]+"em";
			process.chat.setConsoleHeight();
			break;
		default:
			process.print("set: unknown settings: "+args[0]);
			break;
		}
		process.die();
	};
	obj.gyazo=obj.gyoza=function(process){
		if(process.arg){
			vo=parseInt(process.arg);
			if(isNaN(vo) || vo<0 || 2<vo){
				process.print("gyazo: invalid value "+process.arg);
			}else{
				localStorage.soc_highchat_gyoza=vo;
			}
		}
		["餃子無展開","餃子オンマウス","餃子常時"].forEach(function(x,i){
			process.print( (localStorage.soc_highchat_gyoza==i ? "*"+i : i+" ")+
				": "+x);
		});
		process.die();
	};
	obj.clean=obj.clear=function(process){
		var spc=process.chat.command.parentNode;
		process.chat.consoleo.textContent="";
		process.chat.console.appendChild(spc);
		process.die();
	};
	obj.help=function(process){
		process.print([
"command usage: "+localStorage.syschar+"command",
"in, out",
"    inout the chatroom",
"motto",
"    HottoMotto",
"volume [number]",
"    show/set volume",
"set (param) (value)",
"    set options",
"        systemchar",
"        height",
"gyazo [num], gyoza [num]",
"    show/set gyoza mode",
"clear, clean",
"    clean the console",
"js",
"    JavaScript console",
"sc, scroll",
"    Scroll with arrow keys",
		].join("\n"));
		process.die();
	};
	obj.js=function(process){
		process.print("Type '//bye' to finish the console.");
		
		waitforline();
		
		function waitforline(){
			process.input(function(line){
				if(line=="//bye" || line=="//bye\n"){
					process.die();
					return;
				}
				var console={log:function(){
					Array.prototype.forEach.call(arguments,function(x){
						process.put(x.toString()+" ");
					});
				}};
				try{
					process.print(eval(line));
				}catch(e){
					process.print(e);
				}
				waitforline();
			});
		}
	};
	obj.sc=obj.scroll=function(process){
		waitforkey();
		function waitforkey(){
			process.getkey(function(e){
				if(e.keyCode==27){
					//Esc
					process.die();
					return false;
				}
				if(e.keyCode==38){
					window.scrollBy(0,-120);
				}else if(e.keyCode==40){
					window.scrollBy(0,120);
				}
				return true;
			});
		}
	};
	obj.go=function(process){
		process.chat.newwin(process.arg);
		process.die();
	};
/*	obj.g=function(process){
		process.chat.newwin("http://www.google.co.jp/search?q="+encodeURIComponent(process.arg));
	};*/
	
	
	obj.sl=function(process){
		var sl_steam=[
["                      (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @",
"                 (   )",
"             (@@@@)",
"          (    )",
"",
"        (@@@)",
],
[
"                      (  ) (@@) ( )  (@)  ()    @@    O     @     O     @      O",
"                 (@@@)",
"             (    )",
"          (@@@@)",
"",
"        (   )",
]
		],sl_body=[
"      ====        ________                ___________ ",
"  _D _|  |_______/        \\__I_I_____===__|_________| ",
"   |(_)---  |   H\\________/ |   |        =|___ ___|      _________________         ",
"   /     |  |   H  |  |     |   |         ||_| |_||     _|                \\_____A  ",
"  |      |  |   H  |__--------------------| [___] |   =|                        |  ",
"  | ________|___H__/__|_____/[][]~\\_______|       |   -|                        |  ",
"  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_ ",
		],sl_wheels=[
[
"__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=O=====O=====O=====O   |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\O=====O=====O=====O_/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\_O=====O=====O=====O/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=   O=====O=====O=====O|_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],
		];
		
		var counter=0,position=0,sl_length=90,sp_length=30;
		var sl_speed=40;	//wait長さ
		var spaces="";
		for(var i=0;i<sp_length;i++){
			spaces+=" ";	//スペースを作る
		}
		var le=0;	//減った
		sl_move();
		function sl_move(){
			if(counter){
				//2かいめ以降
				process.deletelines(16);	//16行
			}
			var wheel=counter%6;	//6 patterns
			var steam=parseInt(counter/3)%2;
			var cut=function(x){return spaces+x.slice(le)};
			process.print(sl_steam[steam].concat(sl_body,sl_wheels[wheel]).map(cut).join("\n"));
			counter++;
			if(spaces.length>0){
				spaces=spaces.slice(1);
			}else{
				le++;
			}
			if(le<sl_length){
				setTimeout(sl_move,sl_speed);
			}else{
				process.deletelines(16);
				process.die();
			}
		}
		
	};
	return obj;

/*	case "go":
		//移動
		switch(str){
		case "log":case "apiclient":case "list":
			location.href="/"+str;
			break;
		default:
			location.href=str;
		}
		break;*/
})();

CommandLineChat.prototype.cprint=function(str){
	this.cput(str+"\n");
};
CommandLineChat.prototype.cput=function(str){
	this.consoleo.textContent+=str;
	this.cscrollDown();
};
CommandLineChat.prototype.cfocus=function(){
	var sc=document.documentElement.scrollTop || document.body.scrollTop;
	this.command.focus();
	document.documentElement.scrollTop && (document.documentElement.scrollTop=sc);
	document.body.scrollTop && (document.body.scrollTop=sc);
};
CommandLineChat.prototype.cscrollDown=function(){
	this.console.scrollTop= this.console.scrollHeight - this.console.clientHeight;
	
};
CommandLineChat.prototype.userinfo=function(obj){
	SocketChat.prototype.userinfo.apply(this,arguments);
	this.isrom=obj.rom;
	if(!obj.rom)this.cprint("Hello, "+obj.name);
	
};
CommandLineChat.prototype.setConsoleHeight=function(){
	var st=document.styleSheets.item(0);
	st.insertRule("#console { height: "+localStorage.consoleheight+"; bottom:-"+localStorage.consoleheight+"}",st.cssRules.length);
};
CommandLineChat.prototype.newwin=function(url){
	this.form.action=url;
	this.form.submit();
};

