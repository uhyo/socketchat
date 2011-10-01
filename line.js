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

function LineMaker(){
}
LineMaker.prototype={
	make:function(obj){
		var df=document.createDocumentFragment();
		var color=this.getColor(obj.ip);
		var dt=el("dt",obj.name);
		if(obj.syslog)dt.classList.add("syslog");
		dt.style.color=color;
		
		df.appendChild(dt);
		var dd=el("dd","");
		var comsp=el("span",obj.comment);
		comsp.classList.add("comment");
		dd.appendChild(comsp);
		var infsp=el("span","(");
		infsp.classList.add("info");
		var date=new Date(obj.time);
		var time=el("time",date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds());
		time.datetime=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+"T"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"+09:00";
		
		dd.dataset.id=obj._id;
		if(obj.response){
			dd.dataset.respto=obj.response;
			dd.classList.add("respto");
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
	},
	getColor:function(ip){
		var arr=ip.split(/\./);
		return "rgb("+Math.floor(parseInt(arr[0])*0.75)+", "+
		Math.floor(parseInt(arr[1])*0.75)+", "+
		Math.floor(parseInt(arr[2])*0.75)+")";
	},
}


function HighChatMaker(infobar){
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
	while(this.infobar.firstChild)this.infobar.removeChild(this.infobar.firstChild);
	
	this.gyozab=document.createElement("button");
	this.gyozab.textContent=this.gyozas[this.gyoza];
	this.gyozab.classList.add("gyozainfo");
	
	this.gyozab.addEventListener("click",this.gyozabutton.bind(this),false);
	this.infobar.appendChild(this.gyozab);
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
							img.src="http://img.gyazo.com/a/"+res2[1]+".png";
							img.classList.add("thumbnail");
							a.appendChild(img);
						}else{
							a.textContent="[Gyazo]";
						}
						node=node.splitText(res2[0].length);
						node.parentNode.replaceChild(a,node.previousSibling);
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
		img.src="http://img.gyazo.com/a/"+result[1]+".png";
		
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
		this.line=new HighChatMaker(document.getElementById(this.infobarid));
		
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
		
		if(localStorage.socketchat_name){
			document.forms["inout"].elements["uname"].value=localStorage.socketchat_name;
		}
		
		var hottomottob=document.getElementsByClassName("logs")[0].getElementsByClassName("hottomottobutton")[0];
		hottomottob.addEventListener("click",this.HottoMotto.bind(this),false);
		
	},
	cominit:function(){	
		//通信部分初期化
	},
	loginit:function(data){
		data.logs.reverse().forEach(function(line){
			this.write(line);
		},this);
		if(data.logs.length)this.oldest_time=data.logs.shift().time;
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
	},
	//自分が入退室
	userinfo:function(obj){
		console.log("userinfo",obj);
		var f=document.forms["inout"];
		f.elements["uname"].disabled=!obj.rom;
		if(!obj.rom)f.elements["uname"].value=obj.name;
		
		var result=document.evaluate('descendant::input[@type="submit"]',f,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null);
		var bt=result.singleNodeValue;
		bt.value=obj.rom?"入室":"退室";
		this.inout(obj);
	},
	mottoResponse:function(data){
		data.logs.forEach(function(line){
			this.log.appendChild(this.line.make(line));
		},this);
		if(data.logs.length)this.oldest_time=data.logs.pop().time;
	},
	HottoMotto:function(e){
		this.socket.emit("motto",{"time":this.oldest_time});
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
			return;
		}
		var dd=document.evaluate('ancestor-or-self::dd',t,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null).singleNodeValue;
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

		document.forms["comment"].elements["response"].value="";
		dd.appendChild(this.responding_tip);
		this.responding_tip.dataset.to=dd.dataset.id;
	},
	idresponse:function(data){
		if(!this.responding_to || !data)return;
		var line=this.line.make(data);
		for(var i=0,l=line.childNodes.length;i<l;i++){
			line.childNodes[i].classList && line.childNodes[i].classList.add("resp");
		}
		var r=this.responding_to;
		r.parentNode.insertBefore(line,r.nextSibling);
		
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

	socket.emit("regist",{"mode":"client"});
	
};
SocketChat.prototype.inout_notify=function(name){
	this.socket.emit("inout",{"name":name});
};
SocketChat.prototype.say=function(comment,response){
	this.socket.emit("say",{"comment":comment,"response":response?response:""});
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
	}
	console.log(res);
	http.open("get",path+(res.length? "?"+res.join("&"):""),true);
	http.send();
};
APIChat.prototype.cominit=function(){
	this.timerId=setInterval(this.check.bind(this),10000);
	this.check();
};
APIChat.prototype.response=function(obj){
	console.log(obj);
	if(obj.error){
		console.log(obj.errormessage);
		return;
	}
	
	obj.logs.reverse().forEach(function(x){
		this.recv(x);
	},this);
	if(obj.sessionid)this.sessionid=obj.sessionid;
	
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
