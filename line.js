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
		if(obj.channel){
			if(Array.isArray(obj.channel)){
				df.dataset.channel = obj.channel.map(function(ch){return this.createChannelDatasetString(ch)}.bind(this)).join(" ");
			}else{
				df.dataset.channel = this.createChannelDatasetString(obj.channel);
			}
		}
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
	createChannelDatasetString: function(channel){
		return channel.replace(/\//g, "-");
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
