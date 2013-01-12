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
		//コメントは何かな
		var comment = obj.commentObject || obj.comment;
		comsp.appendChild(commentHTMLify(comment));
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
		df.dataset.ip=obj.ip;
		if(obj.channel) df.dataset.channel="#"+(Array.isArray(obj.channel) ? obj.channel.join("#") : obj.channel)+"#";//# is magic
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
	if(this.parent && this.parent.audio)this.parent.setVolume(audioc.value/100);
	audioc.addEventListener("change",function(e){
		//console.log(audioc.value,this.parent.audio);
		if(audioc.checkValidity() && this.parent.audio)this.parent.setVolume((localStorage.soc_highchat_audiovolume=audioc.value)/100);
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
APIChat.prototype.HottoMotto=function(){
	this.send("/api/motto",{"time":this.oldest_time},function(data){
		console.log(data);
		this.mottoResponse(data)
	}.bind(this));
//	this.send("/api/motto",{"time":this.oldest_time},this.mottoResponse.bind(this));
};

//コマンドライン風
function CommandLineChat(log,info,con,fnd){
	var infobar=document.createElement("div");
	infobar.id="aaaaaaaaa____aa_a_a_a_a_a_a_a___aa_a";
	SocketChat.call(this,log,info,infobar.id);
	
	this.consoleid=con;
	this.findlogid=fnd;
	this.cmode="down";	//新しいログは上へ
	
	this.commandlog=[];	// コマンド履歴
	this.commandlogindex=null;	//basho
	
	this.process=null;	//プロセス数
//	this.accept=true;//プロセスの入力

	this.isrom=null;	//ROMかどうか
	
	this.autoin_flg=false;	//autoin処理が行われたかどうか
}
CommandLineChat.prototype=new SocketChat;
CommandLineChat.prototype.prepareHottoMottoButton=function(){};
CommandLineChat.prototype.prepareForm=function(){};
CommandLineChat.prototype.init=function(){
	SocketChat.prototype.init.apply(this);
	
	this.findlog=document.getElementById(this.findlogid);
	
	
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
	this.saves=[];
}
CommandLineChat.Process.prototype={
	//スペース区切り
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
	//新しいコンテキスト
	newContext:function(){
		this.saves.push(this.chat.consoleo.textContent);
		this.chat.consoleo.textContent="";
	},
	//もとに戻す
	restoreContext:function(){
		this.chat.consoleo.textContent=this.saves.pop();
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
	//松尾の改行
	chomp:function(str){
		return str.replace(/\n+$/,"");
	},
};

CommandLineChat.prototype.commands=(function(){
	var obj={};
	obj["in"]=function(process){
		var pr=process.parse(process.arg);
		var str=pr.arg[0];	//名前
		var oauto=pr.opt.indexOf("--auto")>=0;	// autoオプション
		if(!str && oauto){
			// autoフラグ解除
			localStorage.removeItem("socketchat_autoin");
			process.die();
			return;
		}
		if(process.chat.isrom===false){
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
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.out=function(process){
		if(process.chat.isrom===true){
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
		if(process.arg){
			var pr=process.parse(process.arg);
			var until=new Date(pr.arg[0]).getTime();
			if(!isNaN(until)){
				if(!(pr.opt.indexOf("--gmt")>=0 || pr.opt.indexOf("--utc")>=0)){
					//ローカルで書いてあるからずらす
					until+=(new Date).getTimezoneOffset()*60000
				}
				process.chat.HottoMotto(null,until);
				process.die();
				return;
			}
		}
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
	obj.disip=function(process){
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
			localStorage.socketchat_disip=JSON.stringify(process.chat.disip);
		}
		process.chat.disip.forEach(process.print,process);
		process.die();
	};
	obj.resp=function(process){
		//返信を行う
		
		var index=0,maxlen=10;
		
		process.newContext();

		process.getkey(function(e){
			if(e.keyCode==38){
				index--;
				if(index<0)index=0;
				process.deletelines(maxlen);
				view();
			}else if(e.keyCode==40){
				index++;
				process.deletelines(maxlen);
				view();
			}else if(e.keyCode==27){
				//Esc
				end();
				return false;
			}else if(e.keyCode==13){
				//Enter
				var lc=process.chat.log.childNodes;
				var c=lc[index];
				if(!c){
					end();
					return false;
				}
				respto=c.dataset.id;
				process.input(function(inp){
					inp=process.chomp(inp);
					if(inp){
						process.chat.say(inp,respto);
					}
					end();
				});
				return true;	//input側で新たなkeyを設定するから（暫定処置）
			}
			return true;
		});
		view();
		
		function view(){
			var lc=process.chat.log.childNodes;
			var st=Math.max(0,Math.floor(index-maxlen/2));
			for(var i=0;i<maxlen;i++){
				var m=st+i;
				if(m>=lc.length)break;
				process.print((m==index?"* ":"")+ lc[m].textContent);
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
	console.log("userinfo",obj);
	SocketChat.prototype.userinfo.apply(this,arguments);
	this.isrom=obj.rom;
	if(!obj.rom)this.cprint("Hello, "+obj.name);
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

