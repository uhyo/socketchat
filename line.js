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

//ログオブジェクトからログのHTML要素を生成するオブジェクト
//parentはChatClientオブジェクト
function LineMaker(parent){
	this.parent=parent;
}
LineMaker.prototype={
	//ログオブジェクトを渡されると1行(p要素)を返すメソッド
	make:function(obj){
		var df=document.createElement("p");
		var color=this.getColor(obj.ip);
		//名前部分の生成
		var dt=el("bdi",obj.name);	//bdi要素を使うと名前に右から左の文字を使われても表示が崩れない
		if(obj.syslog)dt.classList.add("syslog");
		dt.classList.add("name");
		df.style.color=color;
		
		df.appendChild(dt);
		var dd=el("span","");
		dd.classList.add("main");
		//comsp: コメント部分のbdi
		var comsp=el("bdi");
		comsp.classList.add("comment");
		comsp.appendChild(commentHTMLify(obj.comment));
		dd.appendChild(comsp);
		//チャンネル
		if(obj.channel){
			var c= Array.isArray(obj.channel) ? obj.channel : [obj.channel];
			for(var i=0,l=c.length;i<l;i++){
				//ログのチャンネル名と、本文中のハッシュタグがかぶる場合は本文を優先
				if(obj.comment.indexOf("#"+c[i])===-1){
					dd.appendChild(this.makeChannelSpan(c[i]));
				}
			}
		}
		//時間、IPアドレスなど
		var infsp=el("span");
		infsp.classList.add("info");
		var date=new Date(obj.time);
		var dat=date.getFullYear()+"-"+zero2(date.getMonth()+1)+"-"+zero2(date.getDate()), tim=zero2(date.getHours())+":"+zero2(date.getMinutes())+":"+zero2(date.getSeconds());
		//時間はtime要素
		var time=el("time");
		var datelement=el("span",dat+" "), timelement=el("span",tim);
		datelement.classList.add("date");
		timelement.classList.add("time");
		time.appendChild(datelement);
		time.appendChild(timelement);
		time.appendChild(document.createTextNode("; "));
		//time.datetime=dat+"T"+tim+"+09:00";
		//time.dateTime=date.toISOString();	//datetime属性は廃止された
		
		//コメントの_idを保存（返信など用）
		df.dataset.id=obj._id;
		if(obj.response){
			//そのコメントが返信の場合はdatasetに追加、クラス追加
			df.dataset.respto=obj.response;
			df.classList.add("respto");
		}
		dt.title=dat+" "+tim+", "+obj.ip+(obj.ipff ? " (forwarded for: "+obj.ipff+")" : "");
	
		//IPaddressのspan要素
		var ipelement = el("span",obj.ip+(obj.ipff ? " (forwarded for: "+obj.ipff+")" : "")+"; ");
		ipelement.classList.add("ip");
		infsp.appendChild(time);
		infsp.appendChild(ipelement);
		dd.appendChild(infsp);
		dd.style.color=color;
		df.appendChild(dd);
		return df;

		//要素名と中身のテキストを指定すると生成する関数el
		function el(name,text){
			var ret=document.createElement(name);
			if(typeof text!=="undefined") ret.textContent=text;
			return ret;
		}
		function zero2(str){
			//2桁に0埋めする
			return ("00"+str).slice(-2);
		}
		//obj.commentをHTML化する
		function commentHTMLify(comment){
			if(typeof comment==="object"){
				if(Array.isArray(comment)){
					//配列の場合はそれぞれを再帰的に処理して連結
					var df=document.createDocumentFragment();
					comment.forEach(function(x){
						df.appendChild(commentHTMLify(x));
					});
					return df;
				}else{
					//オブジェクトの場合HTML要素を生成
					//name:要素名 attributes: key-valueのオブジェクト style: key-valueのCSSスタイル
					//childの中身を再帰的に処理して子にする
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
				//テキストならテキストノードを生成
				return document.createTextNode(comment);
			}
		}
	},
	//IPアドレスから色を生成
	getColor:function(ip){
		var arr=ip.split(/\./);
		return "rgb("+Math.floor(parseInt(arr[0])*0.75)+", "+
		Math.floor(parseInt(arr[1])*0.75)+", "+
		Math.floor(parseInt(arr[2])*0.75)+")";
	},
	makeChannelSpan:function(channel){
		return (function(){
			var span = document.createElement("span");
			span.className="channels";
			var wholeChannel = "";
			var channels = channel.split("/");
			for(var i=0; i<channels.length; i++){
				span.appendChild((function(){
					var ch = channels[i];
					var span = document.createElement("span");
					span.className = "channel";
					if(i==0){
						wholeChannel = ch;
						span.textContent = "#"+ch;
					}else{
						wholeChannel += "/"+ch;
						span.textContent = "/"+ch;
					}
					span.dataset.channel = wholeChannel;

					return span;
				})());
			}
			return span;
		})();
	},
}


//LineMakerを継承。HTML化されたコメントをさらに加工
function HighChatMaker(parent,infobar){
	this.parent=parent;
	this.gyoza1_on=null;	//mouseoverがonになっているか
	this.gyozas=["餃子無展開","餃子オンマウス","餃子常時"];
	this.infobar=infobar;	//餃子ボタンなどを置く場所
	if(!infobar){
		//infobarがない場合のエラー防止（見えないdiv）
		this.infobar=document.createElement("div");
	}
	this.init();

	this.setGyoza(localStorage.soc_highchat_gyoza ? localStorage.soc_highchat_gyoza : 0);
	
}
HighChatMaker.prototype=new LineMaker();
HighChatMaker.prototype.init=function(){
	//infobar
	//while(this.infobar.firstChild)this.infobar.removeChild(this.infobar.firstChild);
	
	//餃子ボタン
	this.gyozab=document.createElement("button");
	this.gyozab.textContent=this.gyozas[this.gyoza];
	this.gyozab.classList.add("gyozainfo");
	
	this.gyozab.addEventListener("click",this.gyozabutton.bind(this),false);
	this.infobar.appendChild(this.gyozab);
	
	//audio音量調整
	var audioc=this.audioc=document.createElement("input");
	audioc.type="range",audioc.min=0,audioc.max=100,audioc.step=10;
	//localStorageから音量設定読み出し。未設定の場合50を設定
	audioc.value = (localStorage.soc_highchat_audiovolume!=undefined ? localStorage.soc_highchat_audiovolume : (localStorage.soc_highchat_audiovolume=50));
	if(this.parent && this.parent.audio)this.parent.audio.volume = this.parent.jihou.volume=audioc.value/100;
	audioc.addEventListener("change",function(e){
		//console.log(audioc.value,this.parent.audio);
		if(audioc.checkValidity() && this.parent.audio)this.parent.audio.volume=this.parent.jihou.volume=(localStorage.soc_highchat_audiovolume=audioc.value)/100;
	}.bind(this),false);
	this.infobar.appendChild(audioc);
};
HighChatMaker.gyazoSetting = [
	{
		thumb: true,
		url: {
			image: "http://gyazo.com/",
			thumb: "http://gyazo.com/thumb/",
			ext: true,
		},
		text: {
			normal: "[Gyazo]",
			opening: "[Gyoza…]"
		}
	},
	{
//		thumb: true,
//Myazoがサムネイル機能を撤廃したため
		thumb: false,
		url: {
			image: "http://myazo.net/",
			thumb: "http://myazo.net/s/",
			ext:true,
		},
		text: {
			normal: "[Myazo]",
			opening: "[Myoza…]"
		}
	},
	{
		thumb: true,
		url: {
			image: "http://g.81.la/",
			thumb: "http://g.81.la/thumbnail.php?id=",
			ext: false,
		},
		text: {
			normal: "[81g]",
			opening: "[81kg…]"
		}
	}
];
HighChatMaker.prototype.make=function(obj){
	//LineMakerにHTML要素を生成してもらう
	var df=LineMaker.prototype.make.apply(this,arguments);
	var parse=_parse.bind(this);
	var allowed_tag=["s","small","code"];
	
	//var dd=df.childNodes.item(1);
	//コメント部分をパース
	var dd=df.querySelector(".comment");
	parse(dd);
	//余計なテキストノードなどを除去
	df.normalize();
	return df;
	
	function _parse(node){
		//Text#splitText: テキストノードを先頭からn文字のところで2つに分ける。返り値はあとのノード
		//DocumentFragment: 複数の並列のノードをまとめる親。appendChildしたときは兄弟のみが追加される
		if(node.nodeType==Node.TEXT_NODE){
			//テキストノード
			if(!node.parentNode)return;
			var result=document.createDocumentFragment();
			//全て処理し終えるまで続ける。先頭から順番に処理
			while(node.nodeValue){
				//先頭が開始タグ
				var res=node.nodeValue.match(/^\[(\w+?)\]/);
				if(res){
					if(allowed_tag.indexOf(res[1])<0){
						//そんなタグはないよ！
						node=node.splitText(res[0].length);
						continue;
					}
					//タグが適用される部分をspanで囲む
					var span=document.createElement("span");
					//タグ名はクラスにする
					span.classList.add(res[1]);
					//タグより後ろを一旦全てspan要素の中に突っ込む
					span.textContent=node.nodeValue.slice(res[0].length);
					if(!span.textContent){
						//空だったのでキャンセル。spanは破棄してただのテキスト扱い
						node=node.splitText(res[0].length);
						continue;
					}
					//処理対象のノード（後ろ全て含む）をspan（後ろ全てコピーされた）に置き換え
					node.parentNode.replaceChild(span,node);
					//これからはspanの中のテキストノードを処理していく
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
					while(p=p.parentNode){	//nodeはテキストノードなのでnodeの親からスタート
						if(p.classList && p.classList.contains(res[1])){
							//問題のタグである
							break;
						}
					}
					//タグを閉じる
					if(p){
						//終了タグを取り除いて、nodeの中には終了タグより右側が残る
						node.nodeValue=node.nodeValue.slice(res[0].length);
						//nodeをタグの外へ移動（pの後ろへ）
						p.parentNode.insertBefore(node,p.nextSibling);
					}else{
						//そのタグは無かった。ただのテキストとして処理
						node=node.splitText(res[0].length);
						continue;
					}
					continue;
				}
				//リンク
				res=node.nodeValue.match(/^https?:\/\/\S+/);
				if(res){
					var matched=false;
					//URLがgyazo系かどうか調べる
					for(var i=0, l=HighChatMaker.gyazoSetting.length; i<l; i++){
						var settingObj = HighChatMaker.gyazoSetting[i];
						var res2=res[0].match(new RegExp("^"+settingObj.url.image.replace(".", "\\.")+"([0-9a-f]{32})(?:\\.png)?"));
						if(!res2) continue;
						
						//Gyazo
						var a=document.createElement("a");
						a.target="_blank";
						a.href=settingObj.url.image+res2[1]+(settingObj.url.ext?".png":"");
						a.classList.add("gyoza");
						if(settingObj.thumb && this.gyoza==2){
							//餃子常時展開
							(function(a){
								//クロージャによりa要素への参照を保存（複数Gyazoがあった場合for文の中でaが書き換わってしまうため）
								var img=document.createElement("img");
								img.classList.add("thumbnail");
								img.hidden=true;	//読み込み終わるまで表示しない
								a.appendChild(img);
								//読み込み中の文字列
								var temp_node=document.createTextNode(settingObj.text.opening);
								a.appendChild(temp_node);
								img.addEventListener('load',function(e){
									//文字列を消して画像を表示
									a.removeChild(temp_node);
									img.hidden=false;
								},false);
								img.src=settingObj.url.thumb+res2[1]+".png";
								img.alt=settingObj.url.image+res2[1]+".png";
							})(a);
						}else{
							a.textContent=settingObj.text.normal;
						}
						node=node.splitText(res2[0].length);
						//node.previousSiblingは、 splitTextで切断されたurl部分のテキストノード
						node.parentNode.replaceChild(a,node.previousSibling);
						matched=true;
						break;
					}
					if(matched) continue;
					//通常のリンクだった
					var a=document.createElement("a");
					a.href=res[0];
					a.target="_blank";
					try{
						//%xxなどを普通の文字列に変換する。不正な%があると困るのでtryで囲む
						a.textContent=decodeURIComponent(res[0]);
					}catch(e){
						a.textContent=res[0];
					}
					node=node.splitText(res[0].length);
					node.parentNode.replaceChild(a,node.previousSibling);
					continue;
				}
				//チャネルリンク
				res=node.nodeValue.match(/^(\s*)#(\S+)/);
				if(res){
					if(res[1]){
						//前の空白はいらないのでそのまま流す
						node=node.splitText(res[1].length);
					}
					//チャネルのスタイルを変える
					var span=this.makeChannelSpan(res[2])//document.createElement("span");
					//チャネル部分を分離（スペースは既に分離したのでその分だけ文字数を減らしてカウント）
					node=node.splitText(res[0].length-res[1].length);
					node.parentNode.replaceChild(span,node.previousSibling);
					continue;
				}
				//その他 上記のマークアップを発見するまではただの文字列なので普通にテキストノードを生成
				res=node.nodeValue.match(/^(.+?)(?=\[\/?\w+?\]|https?:\/\/|\s+#\S+)/)
				if(res){
					node=node.splitText(res[0].length);
					continue;
				}
				//もう最後まで何もない。nodeは空のテキストノードになる
				node=node.splitText(node.nodeValue.length);
//				throw new Error("parse failed");
			}
		}else if(node.childNodes){
			//elementノードの場合 子のテキストを再帰的処理
			var nodes=[];
			//途中でchildNodesが変化するので、処理対象のノードをリストアップ
			for(var i=0,l=node.childNodes.length;i<l;i++){
				nodes.push(node.childNodes[i]);
			}
			nodes.forEach(function(x){
				if(x.parentNode===node)
					parse(x);
			});
		}
	}
};
//餃子ボタンにより餃子モードが変更されたりした処理
HighChatMaker.prototype.setGyoza=function(gyoza){
	//localStorageに保存
	this.gyoza=localStorage.soc_highchat_gyoza=gyoza%this.gyozas.length;
	//餃子ボタンを変更
	this.gyozab.textContent=this.gyozas[this.gyoza];

	//イベントをセット/除去
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
//餃子の上に乗った（餃子オンマウス時）
HighChatMaker.prototype.gyozamouse=function(e){
	var t=e.target;
	if(t.classList.contains("gyoza")){
		//既に展開処理を行っている場合はとばす
		if(t.dataset.gyazoloaded) return;
		t.dataset.gyazoloaded=true;

		//どの餃子が調べる
		for(var i=0, l=HighChatMaker.gyazoSetting.length; i<l; i++){
			var settingObj = HighChatMaker.gyazoSetting[i];
			if(!settingObj.thumb) continue;
			var result=t.href.match(new RegExp("^"+settingObj.url.image.replace(".", "\\.")+"([0-9a-f]{32})(?:\\.png)?$"));
			if(result){
				var img=document.createElement("img");
				img.src=settingObj.url.thumb+result[1]+".png";
				img.alt=settingObj.url.image+result[1]+".png";
			
				//非表示のimg要素を生成してloadを待つ
				img.addEventListener("load",ev,false);
				//img.style.display="none";
				img.hidden=true;
				t.textContent=settingObj.text.opening;	//テキストはオープン状態に変更
				t.appendChild(img);
				return;
			}
		}
	}
	
	function ev(e){
		//ロード完了したらオープン中のテキストは除去
		t.removeChild(t.firstChild);
		img.hidden=false;
	}
};
//通信を担当するオブジェクト
function ChatStream(){
	//EventEmitter（onでlistener登録、emitでイベント発火）
	io.EventEmitter.apply(this);
}
ChatStream.prototype=new io.EventEmitter;
ChatStream.prototype.init=function(chat){
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
};
ChatStream.prototype.addChild=function(obj){
	//こどもを追加する。メッセージを受けたらこどもにも送る
	this.children.push(obj);
	//メッセージを受け取る
	var t=this;
	var port=obj.port, channel=obj.channel;
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
		if(d.name==="say"){
			//こどもから来た発言
			var ch= !obj1.channel? [] : (Array.isArray(obj1.channel) ? obj1.channel : [obj1.channel]);
			if(ch.indexOf(channel)<0){
				ch.push(channel);//チャンネルに加える
				obj1.channel=ch;
			}
		}else if(d.name==="find"){
			//サブウィンドウのほうへ流す（関数は送れない）
			//d.args[1]:func
			//motto時はチャンネル限定してあげる
			if(obj1.motto)obj1.channel=channel;
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
ChatStream.prototype.$emit=function(name,obj1){
	//emitするときに内部的に呼ばれる
	var em=io.EventEmitter.prototype.emit;
	//本来のemitのはたらき
	em.apply(this,arguments);
	//子供たちにもイベントを送ってあげる
	var c=this.children;
	for(var i=0,l=c.length;i<l;i++){
		//フィルタリングする
		if(name==="log"){
			var ch=obj1.channel;
			if(Array.isArray(ch)){
				if(ch.indexOf(c[i].channel)===-1){
					//チャンネルではないログは送らない
					continue;
				}
			}else if(ch!==c[i].channel){
				//子どものチャンネルのログのみ送る
				continue;
			}
		}else if(name==="find"){
			//関数が含まれるのでブロック
			continue;
		}
		var port=c[i].port;
		port.postMessage({
			name:name,
			args:Array.prototype.slice.call(arguments,1),
		});
	}
};
ChatStream.prototype.register=function(){
	//自分をサーバーに登録する
};
ChatStream.prototype.setSessionid=function(id){
	this.sessionid=sessionStorage.sessionid=id;
};
//発言する
ChatStream.prototype.say=function(comment,response,channel){
	//コメントからハッシュタグを探す
	if(!channel)channel=[];
	else if(!Array.isArray(channel)){
		channel=[channel];
	}
	var result;
	var save_str=comment;	//とっておく
	//コメントからチャネルを探す
	var flag=false;
	while(result=comment.match(/(?:^|\s+)#(\S+)\s*$/)){
		//文末のハッシュタグはチャネルに組み入れる
		if(channel.indexOf(result[1])<0){
			channel.unshift(result[1]);
		}
		comment=comment.slice(0,comment.length-result[0].length);	//その部分をカット
		flag=true;
	}
	if(flag && /^\s*$/.test(comment)){
		//空っぽになってしまった場合は戻す
		comment=save_str;
	}

	//普通にチャンネルを割り当てる
	result=comment.match(/(?:^|\s+)#\S+/g);
	if(result){
		for(var i=0,l=result.length;i<l;i++){
			var r=result[i].match(/#(\S+)$/);
			var hash=r[1];	//チャンネル名
			if(hash && channel.indexOf(hash)<0){
				channel.push(hash);
			}
		}
	}
	//sayイベントを発行
	this.emit("say",{"comment":comment,"response":response?response:"","channel":channel?channel:""});
};
//発言をサーバーに問い合わせる
ChatStream.prototype.find=function(query,cb){
	//query:  channel?:"foo", id?:"deadbeef...", motto:{time,until}
	this.emit("find",query,function(arr){
		if(!Array.isArray(arr))cb([]);
		cb(arr);
	});
};
//ユーザーをサーバーに問い合わせる
ChatStream.prototype.users=function(cb){
	//ユーザー一覧をサーバーへ請求する
	this.emit("users",function(obj){
		cb(obj);
	});
};

//サーバーとソケットで通信するストリーム
function SocketChatStream(){
	ChatStream.apply(this,arguments);
}
SocketChatStream.prototype=new ChatStream;
SocketChatStream.prototype.init=function(chat){
	ChatStream.prototype.init.apply(this,arguments);

	//ソケットを準備
	var socket;
	var t=this;
	socket=this.socket = io.connect(settings.SOCKET_HOST_NAME||(location.protocol+"//"+location.host));
	socket.on("connect",function(){
		//ソケットidがセッションid
		t.setSessionid(socket.socket.sessionid);
	});
	
	//$emitを乗っ取る
	socket._old_$emit=socket.$emit;
	socket.$emit=function(){
		//ソケットで発生したイベントはSocketChatStreamでも発生する
		t.$emit.apply(t,arguments);
		//本来の働きをさせる
		socket._old_$emit.apply(socket,arguments);
	};
};
SocketChatStream.prototype.emit=function(){
	//ソケットへ送る
	this.socket.emit.apply(this.socket,arguments);
	//this.$emit.apply(this,arguments);
};
SocketChatStream.prototype.register=function(){
	this.socket.emit("register",{"mode":"client","lastid":this.lastid});
};

//APIを利用したストリーム
function APIStream(){
	ChatStream.apply(this,arguments);
}
APIStream.prototype=new ChatStream;
APIStream.prototype.init=function(){
	ChatStream.prototype.init.apply(this,arguments);
	//タイマー
	this.timerid=setInterval(this.check.bind(this),10000);
	//フラグ 既に最初のログを受信したか
	this.init_flg=false;
	//リクエスト先
	this.requestto= settings.SOCKET_HOST_NAME || "";
};
//sessionStorageに入れなくてもいいと思う
APIStream.prototype.setSessionid=function(id){
	this.sessionid=id;
};
//サーバーへリクエストを送る
APIStream.prototype.send=function(path,query,callback){
	var http=new XMLHttpRequest();
	if(!query)query={};
	if(!callback)callback=this.normalresponse.bind(this);
	
	http.onload = function(){
		if(this.status==200){
			console.log(JSON.parse(this.responseText));
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
	console.log(path+(res.length? "?"+res.join("&"):""));
	http.open("get",this.requestto+path+(res.length? "?"+res.join("&"):""));
	http.send();
};
//サーバーからの応答
APIStream.prototype.normalresponse=function(obj){
	var t=this;
	if(obj.error){
		console.log(obj.errormessage);
		return;
	}
	if(!this.init_flg){
		//最初のログだ
		em("init",obj);
		this.init_flg=true;
	}else{
		//たまっているログを受信した
		obj.logs.reverse().forEach(function(x){
			em("log",x);
		},this);
	}
	if(obj.sessionid)this.setSessionid(obj.sessionid);
	
	if(obj.inout){
		em("userinfo",obj.inout);
	}
	obj.userinfos.forEach(function(x){
		switch(x.name){
		case "newuser":
			em("newuser",x.user);
			break;
		case "deluser":
			em("deluser",x.id);
			break;
		case "inout":
			em("inout",x.user);
			break;
		case "users":
			em("users",x.users);
			break;
		}
	},this);
	
	function em(){
		t.$emit.apply(t,arguments);
	}
};
APIStream.prototype.check=function(){
	//サーバーに更新を確認する
	this.send("/api/");
};
APIStream.prototype.register=function(){
	this.check();
};
APIStream.prototype.emit=function(name){
	var args=Array.prototype.slice.call(arguments,1);	//emitのパラメータ
	switch(name){
		case "say":
			//発言
			var obj=args[0];
			this.send("/api/say",obj);
			break;
		case "inout":
			var obj=args[0];
			this.send("/api/inout",obj);
			break;
		case "find":
			//JSONで送る
			var query=args[0], cb=args[1];
			//send!
			this.send("/api/find",{query:JSON.stringify(query)},function(data){
				cb(data);
			});
			break;
		case "users":
			var cb=args[0];
			this.send("/api/users",null,function(data){
				cb(data);
			});
			break;
	}
};

//メインストリームからもらってくる（チャネルウィンドウ）
function ChannelStream(){
	ChatStream.apply(this,arguments);
}
ChannelStream.prototype=new ChatStream;
ChannelStream.prototype.init=function(){
	ChatStream.prototype.init.apply(this,arguments);
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
			document.title+=" #"+d.channelname;
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
ChannelStream.prototype.initPort=function(port){
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
ChannelStream.prototype.emit=function(name){
	//this.$emit.apply(this,arguments);
	if(this.port){
		//ポートへ送る
		this.port.postMessage({
			name:name,
			args:Array.prototype.slice.call(arguments,1),
		});
	}
};
//親へログ検索要求
ChannelStream.prototype.find=function(query,cb){
	var p=this.port;
	//メッセージを
	p.addEventListener("message",listener);
	//リクエスト送信
	/*p.postMessage({
		name:"find",
		query:query,
	});*/
	this.emit("find",query);

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
ChatClient.getAudio = function(filename){
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
	}catch(e){
		//オーディオなんてなかった　ダミーを用意
		audio={play:function(){}};
	}
	return audio;
}
ChatClient.prototype={
	//使用するChatStream
	useStream:function(){return ChatStream},
	getStream:function(){
		var s= new (this.useStream())();
		s.init(this);
		return s;
	},
	init:function(){
		this.me={
			//自分の情報
			name:null,
			rom:null,
		};
	
		//ハッシュによってストリームを切り替えられる
		if(location.hash==="#channel"){
			this.useStream=function(){
				return ChannelStream;
			};
		}
		this.log=document.getElementById(this.logid);
		this.log.textContent="";
		this.info=document.getElementById(this.infoid);
		this.users=this.info.getElementsByClassName("users")[0];
		this.usernumber=this.info.getElementsByClassName("usernumber")[0];
		
		this.usernumber.dataset.actives=this.usernumber.dataset.roms=0;
		this.bots=[];
		this.disip=[];	//IP list
		if(localStorage.socketchat_disip)this.disip=JSON.parse(localStorage.socketchat_disip);
		
		if(localStorage.socketchat_displaynone){
			document.styleSheets[0].insertRule(localStorage.socketchat_displaynone+"{display:none}", 0)
		}

		
		this.responding_to=null;	//dd
		
		//Audio
		if(this.flags.sound){
			this.audio=ChatClient.getAudio("/sound");
		}
		var jihou = this.jihou = ChatClient.getAudio("/jihou");
		var nextJihou = new Date();
		nextJihou.setHours(2);
		nextJihou.setMinutes(0);
		nextJihou.setSeconds(0);
		nextJihou.setMilliseconds(0);
		var sabun = nextJihou.getTime()-(new Date()).getTime();
		if(sabun<0)sabun+=86400000;
		console.log(sabun);
		setTimeout(function(){jihou.play()}, sabun)
		
		//Responding tip(クリックすると右側に出るやつ）
		this.responding_tip=document.createElement("span");
		this.responding_tip.textContent="⇒";
		this.responding_tip.classList.add("responding_tip");
		
		//通信部分初期化
		this.cominit();
		
		
		/*document.forms["inout"].addEventListener("submit",this.submit.bind(this),false);
		document.forms["comment"].addEventListener("submit",this.submit.bind(this),false);*/
		//console.log("init!");
		//フォーム送信
		document.addEventListener("submit",this.submit.bind(this),false);
		
		this.log.addEventListener('click',this.click.bind(this),false);
		
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
	cominit:function(){	
		//通信部分初期化
		var stream;
		//socket=this.socket = io.connect(settings.SOCKET_HOST_NAME||location.origin);
		this.stream=stream=this.getStream();

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

		//サーバーへ登録
		stream.register();
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
		if(this.disip.indexOf(obj.ip)>=0){
			// disip
			return;
		}
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
		this.stream.register();
	},
	//サブチャンネルをオープンする
	openChannel:function(channelname){
		var win=window.open(location.pathname+"#channel");
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
							channel:channelname,
							window:win,
						});
						t.initChild(channel.port1,channelname);
					}
				});

				win.postMessage({
					name:"init",
					channelname:channelname,
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
};

function SocketChat(){
	ChatClient.apply(this,arguments);
}
SocketChat.prototype=new ChatClient;
SocketChat.prototype.useStream=function(){
	return SocketChatStream;
};
/*SocketChat.prototype.HottoMotto=function(e,until){
	if(until){
		this.stream.emit("motto",{"time":this.oldest_time,"until":until});
	}else{
		this.stream.emit("motto",{"time":this.oldest_time});
	}
};*/


function APIChat(){
	ChatClient.apply(this,arguments);
	
}
APIChat.prototype=new ChatClient;
APIChat.prototype.useStream=function(){
	return APIStream;
};

//コマンドライン風
function CommandLineChat(log,info,con,fnd){
	var infobar=document.createElement("div");
	infobar.id="aaaaaaaaa____aa_a_a_a_a_a_a_a___aa_a";	//?????
	SocketChat.call(this,log,info,infobar.id);
	
	this.consoleid=con;
	this.findlogid=fnd;
	this.cmode="down";	//新しいログは上へ
	
	this.commandlog=[];	// コマンド履歴
	this.commandlogindex=null;	//basho
	
	this.process=null;	//プロセス数
//	this.accept=true;//プロセスの入力

	this.autoin_flg=false;	//autoin処理が行われたかどうか
}
CommandLineChat.prototype=new SocketChat;
//HottoMottoボタンやフォームは表示しない
CommandLineChat.prototype.prepareHottoMottoButton=function(){};
CommandLineChat.prototype.prepareForm=function(){};
CommandLineChat.prototype.init=function(){
	SocketChat.prototype.init.apply(this);
	
	this.findlog=document.getElementById(this.findlogid);
	
	//コンソールを準備
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
	
	this.indentSpace="";	//インデント用
	//移動用フォーム
	this.form=document.createElement("form");
	this.form.method="get";
	this.form.target="_blank";
	
	function keydown(e){
		//起動中のプロセスがあればプロセスに送る
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
		//コマンド履歴
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
//コマンドを解析する
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
	//コマンド文字列から命令及びスペースを除去
	str=str.slice(result[0].length);
	if(!this.commands[result[1]]){
		this.cprint(result[1]+": No such command");
		return;
	}
	//result[1]がコマンド名
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
//コマンドのプロセスを管理するオブジェクト
CommandLineChat.Process=function(chat,arg){
	this.chat=chat;
	this.arg=arg;	//arg: コマンドに渡された引数
	
	this.chat.chideinput();
	
	chat.process=this;
	this.saves=[];
}
CommandLineChat.Process.prototype={
	//このプロセスに渡された引数を配列に分けて返す
	parse:function(str,maxlen){
		var ret=[],opt=[],result;
		if(!maxlen)maxlen=1/0;
		while(str && ret.length+1<maxlen){
			result=str.match(/^\s*([^\"\s]+)\s*/);
			if(result){
				if(/^-/.test(result[1])){
					opt.push(result[1]);
				}else{
					ret.push(result[1]);
				}
				str=str.slice(result[0].length);
				continue;
			}
			result=str.match(/^\s*\"((?:\\\"|[^\"])+)\"\s*/);
			if(result){
				ret.push(result[1].replace(/\\\"/g,"\""));
				str=str.slice(result[0].length);
				continue;
			}
			break;
		}
		if(str){
			ret.push(str);
		}
		return {
			arg:ret,
			opt:opt,
		};
	},
	//プロセスからコンソールへ出力
	put:function(str,option){
		this.chat.cput(str,option);
	},
	print:function(str,option){
		this.chat.cprint(str,option);
	},
	//内部をインデントして表示
	indent:function(num,callback){
		this.chat.indent(num,callback);
	},
	//行削除(num:後ろから何行消すか 省略:全部消す)
	deletelines:function(num){
		if(num==null){
			this.chat.consoleo.textContent="";
			return;
		}
		//囲むRange
		var range=document.createRange();
		range.selectNodeContents(this.chat.consoleo);	//いったん中身を全部囲っておく
		for(var i=0;i<num;i++){
			//後ろから改行を見つけていく
			//this.chat.consoleo.textContent=this.chat.consoleo.textContent.replace(/.*\n?$/,"");
			var cs=this.chat.consoleo.childNodes;
			for(var j=cs.length-1;j>=0;j--){
				var node=cs[j];
				var iii=node.textContent.lastIndexOf("\n");
				if(iii>=0){
					//改行を見つけたのでそこまで取り除く
					range.setStart(node,iii);	//改行の直前から
					range.deleteContents();	//Rangeのおわりは一番最後になっている
					break;
				}
			}
			//もう改行がない
			this.chat.consoleo.textContent="";
			break;
		}
		range.detach();
	},
	//新しいコンテキスト（出力フィールドを空にする）
	newContext:function(){
		var range=document.createRange();
		range.selectNodeContents(this.chat.consoleo);
		this.saves.push(range.extractContents());
		this.chat.consoleo.textContent="";
		range.detach();
	},
	//もとに戻す
	restoreContext:function(){
		this.chat.consoleo.textContent="";
		this.chat.consoleo.appendChild(this.saves.pop());
	},
	//行単位で入力 結果はコールバック
	input:function(cb){
		//複数行対応
		this.chat.copeninput("");	//入力できる状態にする
		var result=""
		//入力を受け付けるリスナ
		this.key=function(e){
			if(e.keyCode==13){
				//Shift+Enter
				this.print(this.chat.command.value);
				result+=this.chat.command.value+"\n";
				//入力を上に表示して次の行に移る
				this.chat.command.value="";
				this.chat.cfocus();
				if(!e.shiftKey){
					//終了
					//（最後に改行を含む系）
					this.chat.chideinput();
					this.key=null;	//入力受付解除
					cb(result);
				}
			}
		}.bind(this);
	},
	//キーひとつを受け付ける入力 trueを返すと続行
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
	//プロセス終了 通常モードに戻す
	die:function(chat){
		this.chat.process=null;
		this.chat.copeninput(">");
	},
	//松尾の改行
	chomp:function(str){
		return str.replace(/\n+$/,"");
	},
};

//実効できるコマンド
CommandLineChat.prototype.commands=(function(){
	var obj={};
	obj["in"]=function(process){
		//入室
		var pr=process.parse(process.arg);
		var str=pr.arg[0];	//名前
		var oauto=pr.opt.indexOf("--auto")>=0;	// autoオプション
		if(!str && oauto){
			// autoフラグ解除
			localStorage.removeItem("socketchat_autoin");
			process.die();
			return;
		}
		//既に入室している
		if(process.chat.me.rom===false){
			process.print("You are already in the room.");
			process.die();
			return;
		}
		if(str=pr.arg[0]){
			localStorage.socketchat_name=str;
			if(oauto){
				// 次から自動入室
				localStorage.socketchat_autoin=str;
			}
		}
		//入室する
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.out=function(process){
		//退室
		if(process.chat.me.rom===true){
			process.print("You are not in the room.");
			process.die();
			return;
		}
		var str;
		if(str=process.arg){
			//次回の名前を設定できる（いるのだろうか）
			localStorage.socketchat_name=str;
		}
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.motto=function(process){
		//HottoMotto要求
		if(process.arg){
			//日時指定（この日時まで読み込む）
			var pr=process.parse(process.arg);
			var until=new Date(pr.arg[0]).getTime();
			if(!isNaN(until)){
				if(!(pr.opt.indexOf("--gmt")>=0 || pr.opt.indexOf("--utc")>=0)){
					//ローカルで書いてあるからずらす
					until+=(new Date).getTimezoneOffset()*60000
				}
				process.chat.HottoMotto(until);
				process.die();
				return;
			}
		}
		//通常のmotto（一定数読み込み）
		process.chat.HottoMotto();
		process.die();
	};
	obj.volume=function(process){
		//ボリューム変更
		if(process.arg){
			var vo=parseInt(process.arg);
			if(isNaN(vo) || vo<0 || 100<vo){
				process.print("volume: invalid volume "+process.arg);
			}else{
				localStorage.soc_highchat_audiovolume=vo;
				process.chat.audio.volume=process.chat.audio.volume=vo/100;
			}
		}else{
			//現在のボリュームを表示
			process.print(localStorage.soc_highchat_audiovolume);
		}
		process.die();
		
	};
	obj.set=function(process){
		//設定
		var args=process.parse(process.arg,2).arg;
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
		//餃子設定
		if(process.arg){
			vo=parseInt(process.arg);
			if(isNaN(vo) || vo<0 || 2<vo){
				process.print("gyazo: invalid value "+process.arg);
			}else{
				localStorage.soc_highchat_gyoza=vo;
			}
		}
		["餃子無展開","餃子オンマウス","餃子常時"].forEach(function(x,i){
			process.put((localStorage.soc_highchat_gyoza==i ? "*"+i : i+" "),{color:"#00ffff"});
			process.print(": "+x);
		});
		process.die();
	};
	obj.clean=obj.clear=function(process){
		//コンソール掃除
		var spc=process.chat.command.parentNode;
		process.chat.consoleo.textContent="";
		process.chat.console.appendChild(spc);
		process.die();
	};
	obj.help=function(process){
		process.print([
"command usage: "+localStorage.syschar+"command",
"in [name] [--auto]",
"    enter the chatroom",
"    --auto(with name): auto-enter at the next time",
"    --auto(with no name): don't auto-enter",
"out",
"    quit the chatroom",
"motto [until] [--gmt] [--utc]",
"    HottoMotto",
"      until(is exists): ex) 2012-01-01",
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
"disip [-d] [ip] ",
"    set/remove ip into/from disip list",
"resp",
"    response to a comment",
"go [URL|alias|#channelname]",
"    alias: 'wiki'",
		].join("\n"));
		process.die();
	};
	obj.js=function(process){
		//JSコンソール
		process.print("Type '//bye' to finish the console.");
		
		waitforline();
		
		function waitforline(){
			//1行読んでevalに投げる
			process.input(function(line){
				if(line=="//bye" || line=="//bye\n"){
					process.die();
					return;
				}
				//consoleを書き換える
				var console={log:function(){
					Array.prototype.forEach.call(arguments,function(x){
						process.put(x.toString()+" ");
					});
				}};
				try{
					var result=eval(line);
					//結果を表示
					write(result,0);
					process.print("");	//改行
				}catch(e){
					//エラー
					process.print(e,{color:"#ff0000",fontWeight:"bold"});
				}
				waitforline();
			});
		}
		function write(obj,nest){
			var color,flag;
			if(!nest)nest=0;
			if(nest>=2)debugger;
			if(obj==null){
				color="#eeeeee";
			}else if(typeof obj==="function"){
				color="#33ffff";
			}else if(typeof obj==="number"){
				color="#3333ff";
			}else if(typeof obj==="boolean"){
				color="#33ff33";
			}else if(typeof obj==="string"){
				flag=true;	//自前描画
				process.put('"');
				process.put(obj,{color:"#ff0000"});
				process.put('"');
			}else{
				//オブジェクト
				if(nest>=3){
					//深追いしない
				}else if(Array.isArray(obj)){
					//配列
					if(obj.length<200){
						//あぶない
						flag=true;
						process.put("[");
						var l=obj.length-1;
						obj.forEach(function(x,i){
							write(x,nest+1);
							if(i<l){
								process.put(", ");
							}
						});
						process.put("]");
					}else{
						result=JSON.stringify(obj);
					}
				}else{
					//オブジェクト
					var keys=Object.getOwnPropertyNames(obj);
					if(keys.length<50){
						//あぶない
						flag=true;
						process.put("{\n");
						//debugger;
						process.indent(2,function(){
							var l=keys.length-1;
							keys.forEach(function(x,i){
								write(x);
								process.put(": ");
								write(obj[x],nest+1);
								if(i<l){
									process.put(",\n");
								}else{
									process.put("\n");
								}
							});
						});
						process.put("}");
					}
				}
			}
			if(!flag){
				process.put(obj,{color:color});
			}
		}
	};
	obj.sc=obj.scroll=function(process){
		//上下キーでスクロールするコマンド
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
		//新しいウィンドウで移動
		var dest=process.arg;
		if(dest==="wiki"){
			//wikiへ飛ぶ
			dest="http://shogiwiki.81.la/shogiwiki/";
		}else{
			var result=dest.match(/^#(\S+)$/);
			if(result){
				process.chat.openChannel(result[1]);
				process.die();
				return;
			}
		}
		process.chat.newwin(dest);
		process.die();
	};
	obj.disip=function(process){
		//disip設定
		var pr=process.parse(process.arg);
		var ip=pr.arg[0];
		if(ip){
			if(pr.opt.indexOf("-d")>=0){
				//削除
				process.chat.disip=process.chat.disip.filter(function(x){
					return x!=ip;
				});
			}else{
				if(process.chat.disip.some(function(x){return x==ip})){
					process.print("disip: already exists:"+ip);
				}else{
					process.chat.disip.push(ip);
				}
			}
			//localStorageに保存
			localStorage.socketchat_disip=JSON.stringify(process.chat.disip);
		}
		//現在のdisipを表示して終了
		process.chat.disip.forEach(process.print,process);
		process.die();
	};
	obj.resp=function(process){
		//返信を行う
		
		var index=0,maxlen=10;
		var choosing=true;
		
		//返信先表示画面
		process.newContext();

		process.getkey(function(e){
			//上下：返信先選択
			if(e.keyCode==38){
				while(true){
					index--;
					if(index<=0){
						index=0;
					}else{
						var node=process.chat.log.childNodes[index];
						if(node && node.nodeType===Node.ELEMENT_NODE && node.classList.contains("resp")){
							//とばす
							continue;
						}
					}
					break;
				}
				//書き換え
				process.deletelines();
				view();
			}else if(e.keyCode==40){
				while(true){
					index++;
					var node=process.chat.log.childNodes[index];
					if(node && node.nodeType===Node.ELEMENT_NODE && node.classList.contains("resp")){
						//とばす
						continue;
					}
					break;
				}
				process.deletelines();
				view();
			}else if(e.keyCode==27){
				//Esc
				end();
				return false;
			}else if(e.keyCode==13){
				//Enter
				if(!choosing)return false;
				var lc=process.chat.log.childNodes;
				var c=lc[index];
				if(!c){
					end();
					return false;
				}
				respto=c.dataset.id;
				//返信内容入力
				process.input(function(inp){
					inp=process.chomp(inp);
					if(inp){
						process.chat.say(inp,respto);
					}
					end();
				});
				choosing=false;
				return true;	//input側で新たなkeyを設定するから（暫定処置）
			}
			return true;
		});
		view();
		
		function view(){
			//返信先表示
			var lc=process.chat.log.childNodes;
			var st=Math.max(0,Math.floor(index-maxlen/2));
			for(var i=0;i<maxlen;i++){
				var m=st+i;
				if(m>=lc.length)break;
				process.put((m==index?"* ":"  "),{color:"#00ffff"});
				if(lc[m].classList.contains("resp"))process.put("  ");	//返信のインデント
				process.print(lc[m].textContent);
			}
		}
		function end(){
			//終了
			process.restoreContext();
			process.die();
		}	
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
		process.newContext();
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
				//process.deletelines(16);
				process.restoreContext();
				process.die();
			}
		}
		
	};
	return obj;
})();

CommandLineChat.prototype.cprint=function(str,option){
	this.cput(str+"\n",option);
};
CommandLineChat.prototype.cput=function(str,option){
	var ins;
	str=String(str);
	//まずインデント設定
	if(this.indentSpace.length>0){
		str=setIndent(str,this.indentSpace);
		var con=this.consoleo.textContent;
		if(con.length===0 || con.lastIndexOf("\n")===con.length-1){
			str=this.indentSpace+str;	//最初にもつける
		}
	}
	if(!option){
		//ただの文字列
		ins=document.createTextNode(str);
	}else{
		ins=document.createElement("span");
		ins.textContent=str;
		//cssプロパティ
		for(var key in option){
			if(option[key]!=null){
				ins.style[key]=option[key];
			}
		}
	}
	//this.consoleo.textContent+=str;
	this.consoleo.appendChild(ins);
	this.consoleo.normalize();
	this.cscrollDown();

	function setIndent(str,space){
		return str.split("\n").map(function(x,i){return x&&i>0?space+x:x}).join("\n");	//最初だけスペースいらない
	}
};
	//内部をインデントして表示
CommandLineChat.prototype.indent=function(num,callback){
	var t=this;
	setindent(num);
	callback();
	setindent(-num);

	function setindent(n){
		if(n>0){
			for(var i=0;i<n;i++){
				t.indentSpace+=" ";
			}
		}else if(n<0){
			t.indentSpace=t.indentSpace.slice(-n);	//FIFOのスペース列
		}
	}
};
CommandLineChat.prototype.cfocus=function(){
	//コマンドにフォーカスするとスクロールしてしまうので一時的にスクロール位置保存
	var sc=document.documentElement.scrollTop || document.body.scrollTop;
	this.command.focus();
	document.documentElement.scrollTop && (document.documentElement.scrollTop=sc);
	document.body.scrollTop && (document.body.scrollTop=sc);
};
CommandLineChat.prototype.cscrollDown=function(){
	this.console.scrollTop= this.console.scrollHeight - this.console.clientHeight;
	
};
//サーバーからユーザー情報が送られてきたらコンソールに表示
CommandLineChat.prototype.userinfo=function(obj){
	SocketChat.prototype.userinfo.apply(this,arguments);
	if(!obj.rom){
		this.cput("Hello, ");
		this.cprint(obj.name,{color:"#ffff00"});
	}
	if(obj.rom && !this.autoin_flg && localStorage.socketchat_autoin){
		this.inout_notify(localStorage.socketchat_autoin);
	}
	this.autoin_flg=true;
	
};
CommandLineChat.prototype.setConsoleHeight=function(){
	var st=document.styleSheets.item(0);
	st.insertRule("#console { height: "+localStorage.consoleheight+"; bottom:-"+localStorage.consoleheight+"}",st.cssRules.length);
};
CommandLineChat.prototype.newwin=function(url){
	this.form.action=url;
	this.form.submit();
};

