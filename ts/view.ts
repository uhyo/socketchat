/// <reference path="connection.ts"/>
/// <reference path="process.ts"/>
//HTML5 additions for TypeScript lib
interface HTMLTimeElement extends HTMLElement{
	dateTime?:string;
}
interface HTMLOutputElement extends HTMLElement{
	name:string;
	value:string;
	type:string;
}
interface HTMLElement{
}
interface DOMStringMap{
	//強引な解決策。使うもの全部登録
	channel:string;
	ip:string;
	actives:string;
	roms:string;
	id:string;
	respto:string;
	autocomplete:string;
}
interface Document{
	createTreeWalker(root:Node,type:number,func:Function,flag:boolean):TreeWalker;
}
//DOM3 XPath
interface XPathNSResolver{
	lookupNamespaceURI(prefix:string):string;
}

interface XPathEvaluator{
	evaluate(expression:string,contextNode:Node,resolver:XPathNSResolver,type:number,result:any):any;
}
//ちょっと違うけど・・・
interface Document extends XPathEvaluator{}

declare class AutoComplete{
	constructor(obj: any, obj2: any);
}

module Chat{

	//チャット外観の全体
	export class ChatView{
		//protected
		public container:HTMLElement;
		public linksView:ChatLinksView;
		public settingView:ChatSettingView;
		//public
		public logView:ChatLogView;
		//protected
		public userView:ChatUserView;
		public ui:ChatUI;
		public motto:ChatUICollection.MottoForm;
		//why public
		public dis:ChatLogDisManager;

		//protected
		constructor(public userData:ChatUserData,public connection:ChatConnection,public receiver:ChatReceiver,public process:ChatProcess,com:boolean,channel:string){
			this.initView(userData,connection,receiver,process,com,channel);
		}
		//表示部分的な?
		initView(userData:ChatUserData,connection:ChatConnection,receiver:ChatReceiver,process:ChatProcess,com:boolean,channel:string):void{
			this.container=document.createElement("div");
			//コンテナはbodyに入れる
			document.body.setAttribute('role','application');
			document.body.appendChild(this.container);
			//disマネージャ
			this.dis=new ChatLogDisManager(userData);

			//設定・リンク部分を初期化
			if(com){
				this.linksView=null;
				this.settingView=null;
			}else{
				this.linksView=new ChatLinksView();
				this.settingView=new ChatSettingView(userData,this);
			}
			//ログ表示部分を初期化
			this.logView=new ChatLogView(userData,receiver,process,this,this.dis);
			//ユーザー一覧部分を初期化
			this.userView=new ChatUserView(receiver,this,this.dis);
			//ユーザー操作部分を初期化
			//UIを選ぶ
			if(com){
				this.ui=new ChatCmdUI(userData,receiver,process,this,this.dis);
			}else{
				this.ui=new ChatNormalUI(userData,receiver,process,this,this.dis,channel);
			}
			//HottoMottoボタンを初期化
			this.motto=new ChatUICollection.MottoForm();
			this.motto.onMotto((data:MottoNotify)=>{
				receiver.motto(data);
			});
			//disマネージャ初期化
			//UIを組もう!
			if(this.linksView)this.container.appendChild(this.linksView.getContainer());
			if(this.settingView)this.container.appendChild(this.settingView.getContainer());
			this.container.appendChild(this.ui.getContainer());
			this.container.appendChild(this.logView.getContainer());
			this.container.appendChild(this.userView.getContainer());
			this.container.appendChild(this.motto.getContainer());
			//接続関係
			receiver.on("disconnect",()=>{
				document.body.classList.add("discon");
			});
			receiver.on("reconnect",()=>{
				document.body.classList.remove("discon");
			});
			//下までスクロールしたら自動mottoする
			window.addEventListener("scroll",(e:UIEvent)=>{
				var st=document.body.scrollTop || document.documentElement.scrollTop || 0;
    			var cl=(<HTMLElement>document.documentElement).offsetHeight;
				var i=window.innerHeight;
				if(st >= cl-i){
					//下までスクロールした
					receiver.motto({});
				}
			},false);
			if(channel){
				document.title="#"+channel+" - "+document.title;

			}
		}
		//設定がされたので反映させる
		refreshSettings():void{
			this.settingView.refreshSettings();
			this.logView.refreshSettings();
			this.ui.refreshSettings();
		}
		//発言欄にフォーカスする
		focusComment(focus:boolean,channel?:string):void{
			this.ui.focusComment(focus,channel);
		}
		//仕様を表示してあげる
		showSiyou():void{
			alert("\
・「餃子無展開」「餃子常時」「餃子オンマウス」ボタン\n\
　gyazo.comでアップロードされた画像のサムネイル表示設定\n\
\n\
・「欄#」「窓#」ボタン\n\
　ハッシュタグのクリック時の表示設定\n\
　欄#　タグ欄に入力されてタグ内での発言がハイライトされる\n\
　窓#　専用ウィンドウを開く\n\
\n\
・記法\n\
　[s]取り消し線[/s]　(閉じ省略可)\n\
　[small]文字サイズ小さく[/small]　(閉じ省略可)\n\
　[code]等幅フォント+改行無し[/code]　(閉じ省略可)\n\
　[math]\\LaTeX 数式[/math]\n\
　#hashtag　hashtagタグに発言\n\
　.#hashtag　hashtagタグを参照(リンクのみ)\n\
　@発言ID　発言IDへのリプライを付加\n\
\n\
・発言クリックで右に出る矢印について\n\
　緑クリックで下に枠が出るのでそこに入力して発言すると返信になる\n\
　灰色クリックで矢印を消す\n\
");
		}
		//強制的にコンソールを開く
		openConsole():void{
			var cons=new ChatCmdUI(this.userData,this.receiver,this.process,this,this.dis);
			var sole=cons.getConsole();
			this.container.appendChild(cons.getContainer());
			sole.openConsole();
			sole.onClose(()=>{
				cons.cleanup();
			});
		}
		getContainer():HTMLElement{
			return this.container;
		}
	}
	//リンク一覧
	export class ChatLinksView{
		private container:HTMLElement;
		//リンク一覧
		private links:{url:string;name:string;}[][]=[
			[
				{
					url:"http://shogitter.com/",
					name:"将棋",
				},
				{
					url:"http://81.la/shogiwiki/",
					name:"wiki",
				},
				{
					url:"http://81.la/cgi-bin/up/",
					name:"up",
				},
			],[
				{
					url:"/list",
					name:"list",
				},
				{
					url:"/log",
					name:"log",
				},
				{
					url:"/com",
					name:"com",
				},
				{
					url:"/smp",
					name:"SMP",
				},
				{
					url:"https://github.com/uhyo/socketchat/issues",
					name:"issues",
				},
			],
		];
		constructor(){
			this.container=document.createElement("div");
			this.container.classList.add("links");
			this.container.appendChild(this.makeLinks());
		}
		getContainer():HTMLElement{
			return this.container;
		}
		makeLinks():DocumentFragment{
			var df=document.createDocumentFragment();

			for(var i=0,l=this.links.length;i<l;i++){
				var ls=this.links[i];
				var ul=document.createElement("ul");
				for(var j=0,m=ls.length;j<m;j++){
					var o=ls[j];

					var a=<HTMLAnchorElement>document.createElement("a");
					a.href=o.url;
					a.target="_blank";
					a.textContent=o.name;
					ul.appendChild(makeEl("li",(li)=>{
						li.appendChild(a);
					}));
				}
				df.appendChild(ul);
			}
			return df;
		}
	}
	//設定
	export class ChatSettingView{
		private container:HTMLFormElement;
		//餃子セッティング一覧
		private gyozaSettings:string[]=["餃子無展開","餃子オンマウス","餃子常時"];
		//オーディオセッティング一覧
		private audioSettings:string[]=["ミュート","システム音ON","システム音OFF"];
		//チャネルセッティング一覧
		private channelSettings:string[]=["欄#","窓#"];
		constructor(private userData:ChatUserData,private view:ChatView){
			this.container=<HTMLFormElement>document.createElement("form");
			this.container.classList.add("infobar");
			//餃子ボタン生成
			this.container.appendChild(this.makeGyozaButton());
			//ボリューム操作生成
			this.container.appendChild(this.makeVolumeRange());
			//オーディオ設定ボタン
			this.container.appendChild(this.makeAudioModeButton());
			//チャネル開き方
			this.container.appendChild(this.makeChannelModeButton());
			//仕様ボタン
			this.container.appendChild(this.makeSiyouButton());
		}
		makeGyozaButton():HTMLElement{
			var button:HTMLInputElement=<HTMLInputElement>document.createElement("input");
			var ud=this.userData;
			button.name="gyozabutton";
			button.type="button";
			button.value=this.gyozaSettings[ud.gyoza];
			button.addEventListener("click",(e:Event)=>{
				//クリックされたら変更
				ud.gyoza=(ud.gyoza+1)%this.gyozaSettings.length;
				ud.save();
				//ビューに変更を知らせる
				this.view.refreshSettings();
			},false);
			return button;
		}
		makeVolumeRange():DocumentFragment{
			var df=document.createDocumentFragment();
			/*df.appendChild(makeEl("span",(span)=>{
				span.className="icon volumeicon";
				span.textContent="\ue003";
			}));*/
			var range=<HTMLInputElement>document.createElement("input");
			var ud=this.userData;
			range.name="volume";
			range.type="range";
			range.min="0", range.max="100", range.step="10";
			range.value=String(ud.volume);
			//変更時
			var timerid=null;
			range.addEventListener("change",(e:Event)=>{
				//毎回saveするのは気持ち悪い。操作終了を待つ
				ud.volume=Number(range.value);
				clearTimeout(timerid);
				timerid=setTimeout(()=>{
					ud.save();
				},1000);
			},false);
			df.appendChild(range);
			return df;
		}
		makeAudioModeButton():HTMLElement{
			var button:HTMLInputElement=<HTMLInputElement>document.createElement("input");
			var ud=this.userData;
			button.name="audiomode";
			button.type="button";
			button.value=this.audioSettings[ud.audioMode];
			button.addEventListener("click",(e:Event)=>{
				//クリックされたら変更
				ud.audioMode=(ud.audioMode+1)%this.audioSettings.length;
				ud.save();
				//ビューに変更を知らせる
				this.view.refreshSettings();
			},false);
			return button;
		}
		makeChannelModeButton():HTMLElement{
			var button:HTMLInputElement=<HTMLInputElement>document.createElement("input");
			var ud=this.userData;
			button.name="channelmode";
			button.type="button";
			button.value=this.channelSettings[ud.channelMode];
			button.addEventListener("click",(e:Event)=>{
				//クリックされたら変更
				ud.channelMode=(ud.channelMode+1)%this.channelSettings.length;
				ud.save();
				//ビューに変更を知らせる
				this.view.refreshSettings();
			},false);
			return button;
		}
		makeSiyouButton():HTMLElement{
			var button:HTMLInputElement=<HTMLInputElement>document.createElement("input");
			var ud=this.userData;
			button.name="siyou";
			button.type="button";
			button.value="仕様";
			button.addEventListener("click",(e:Event)=>{
				//クリックされたら仕様を表示してあげる
				this.view.showSiyou();
			},false);
			return button;
		}

		getContainer():HTMLElement{
			return this.container;
		}
		refreshSettings():void{
			//設定変更
			var form=this.container, ud=this.userData;
			//餃子
			var gyozabutton=<HTMLInputElement>form.elements["gyozabutton"];
			gyozabutton.value=this.gyozaSettings[ud.gyoza];
			//ボリューム
			var volumeRange=<HTMLInputElement>form.elements["volume"];
			volumeRange.value=String(ud.volume);
			//オーディオ設定
			var audiobutton=<HTMLInputElement>form.elements["audiomode"];
			audiobutton.value=this.audioSettings[ud.audioMode];
			//チャンネル
			var channelbutton=<HTMLInputElement>form.elements["channelmode"];
			channelbutton.value=this.channelSettings[ud.channelMode];
		}
	}
	//ログ表示部分
	export class ChatLogView{
		private container:HTMLElement;
		private flow:ChatLogFlow;
		private audio:Array<HTMLAudioElement>;

		constructor(private userData:ChatUserData,private receiver:ChatReceiver,private process:ChatProcess,private view:ChatView,private dis:ChatLogDisManager){
			this.container=document.createElement("div");
			this.flow=new ChatLogFlow(userData,receiver);
			dis.registerLogContainer(this.flow.getContainer());
			this.container.appendChild(this.flow.getContainer());
			this.refreshSettings(); //初期設定
			//オーディオ準備
			// [0]: ログ更新
			// [1]: 入室
			// [2]: 退室、失踪
			this.audio = [];
			this.audio.push(this.getAudio("/sound"));
			this.audio.push(this.getAudio("/sound_sys1"));
			this.audio.push(this.getAudio("/sound_sys2"));
			//フローにイベント登録する
			var fe=this.flow.event;
			fe.on("logaudio",(soundId:number)=>{
				if(soundId >= 0 && soundId < this.audio.length){
					//オーディオを鳴らす指令
					this.audio[soundId].volume=this.userData.volume/100;
					this.audio[soundId].play();
				}
			});
			fe.on("focusChannel",(channel:string)=>{
				//チャネルに注目した
				if(userData.channelMode===0){
					//欄#
					var focusedChannel=this.dis.setFocusChannel(channel, true);
					this.view.focusComment(false,focusedChannel);
				}else{
					//窓#
					//もとのほうは薄くする
					this.dis.addDischannel(channel,true,false);
					this.process.openChannel(channel,()=>{
						this.dis.removeDischannel(channel,true,false);
					});
				}
			});
			fe.on("openReplyForm",(log:HTMLElement)=>{
				//このログに対して返信フォームを開くべきだ
				if(log.classList.contains("replyready")){
					//すでに返信フォームが開いている
					return;
				}
				var comForm=new ChatUICollection.CommentForm(receiver,true,null);//子窓で返信時どうするか
				var cont=comForm.getContainer();
				//最初にマークつける
				var p=cont.getElementsByTagName("p")[0];
				if(p){
					p.insertBefore(makeEl("span",(el)=>{
						el.className="icon respin opened";
						el.textContent="\ue000";
					}),p.firstChild);
				}
				log.parentNode.insertBefore(cont,log.nextSibling);
				log.classList.add("replyready");	//返信フォームが開いている
				comForm.event.on("comment",(data:CommentNotify)=>{
					//返信情報
					data.response=log.dataset.id;
					this.process.comment(data);
					appearAnimation(cont,"vertical",false,true);
					log.classList.remove("replyready");
				});
				comForm.event.on("cancel",()=>{
					appearAnimation(cont,"vertical",false,true);
					log.classList.remove("replyready");
				});
				appearAnimation(cont,"vertical",true,true);
				var ch=log.dataset.channel || "";
				//返信先チャネル決定
				var result=ch.match(/^#([^#]+)\/(?:#|$)/);
				console.log(result);
				if(result){
					comForm.setChannel(result[1]);
				}else{
					comForm.setChannel(null);
				}
				comForm.focus();
			});

		}
		getContainer():HTMLElement{
			return this.container;
		}
		//設定変更された
		refreshSettings():void{
			this.flow.refreshSettings();
		}
		//オーディオ初期化
		getAudio(filename:string):HTMLAudioElement{
			var audio:HTMLAudioElement;
			try{
				audio=new Audio();
				audio.removeAttribute("src");
				["ogg","mp3","wav"].forEach((ext:string)=>{
					var source=<HTMLSourceElement>document.createElement("source");
					source.src=filename+"."+ext;
					source.type="audio/"+ext;
					audio.appendChild(source);
				});
			}catch(e){
				//オーディオなんてなかった
				audio=<HTMLAudioElement>{play:function(){}};
			}
			return audio;
		}
	}
	//ログ表示本体
	export class ChatLogFlow{
		public event:EventEmitter;
		private container:HTMLElement;
		private lineMaker:ChatLineMaker;
		private gyozaOnmouseListener:Function;
		private toolbox:HTMLElement;
		private selectedLog:HTMLElement;	//現在toolboxが表示しているログ
		constructor(private userData:ChatUserData,private receiver:ChatReceiver){
			this.event=getEventEmitter();
			this.container=document.createElement("div");
			this.container.setAttribute('role','log');
			this.container.classList.add("logbox");
			setUniqueId(this.container,"log");
			this.lineMaker=new ChatLineMaker(userData);
			//流れてきたログをキャッチ!!
			//ログたくさんきた
			receiver.on("loginit",(logs:LogObj[])=>{
				//まず全部消す
				var range=document.createRange();
				range.selectNodeContents(this.container);
				range.deleteContents();
				range.detach();
				//逆にしてアレする
				logs.reverse().forEach((log:LogObj)=>{
					this.getLog(log,true);
				});
			});
			//ログひとつきた
			receiver.on("log",(log:LogObj)=>{
				this.getLog(log,false);
			});
			//Mottoのログがきた
			receiver.on("mottoLog",(logs:LogObj[])=>{
				logs.forEach((log:LogObj)=>{
					var line:HTMLElement=this.lineMaker.make(log);
					this.container.appendChild(line);
				});
			});
			//餃子オンマウス用の処理入れる
			this.gyozaOnmouseListener=((e:Event)=>{
				var t=<HTMLAnchorElement>e.target;	//先取り
				if(!t.classList.contains("gyoza")){
					return; //違う
				}
				//既に展開されている場合はとばす
				if(t.classList.contains("gyozaloaded")){
					return;
				}
				this.lineMaker.checkGyoza(t);
			}).bind(this);
			//クリックに対応する
			this.container.addEventListener("click",<(e:Event)=>void>this.clickHandler.bind(this),false);
			//ツールボックスの準備をする
			this.toolbox=this.makeToolbox();
			//アイコンをコピーされると困る
			var clistener=(e:ClipboardEvent)=>{
				var selection=window.getSelection();
				var box:{range:Range;df:DocumentFragment;}[]=[];
				for(var i=0,l=selection.rangeCount;i<l;i++){
					var range=selection.getRangeAt(i);
					var an=range.commonAncestorContainer;
					//TreeWalkerでアイコンを探す
					var tw=document.createTreeWalker(an,NodeFilter.SHOW_ELEMENT,(node:HTMLElement)=>{
						if(node.classList.contains("icon")){
							//アイコン
							return NodeFilter.FILTER_ACCEPT;
						}else{
							return NodeFilter.FILTER_SKIP;
						}
					},false);
					tw.currentNode=range.startContainer;
					var node:HTMLElement;
					var range2:Range;
					while(node=<HTMLElement>tw.nextNode()){
						if(!range2)range2=document.createRange();
						//範囲を通りすぎてないかチェック
						range2.selectNode(node);
						if(range.compareBoundaryPoints(Range.START_TO_END,range2)<=0){
							//通り過ぎた。終了
							break;
						}
						//TreeWalkerが見失わないようにとりあえず親
						tw.currentNode=node.parentNode;
						//アイコンである。消去する
						var df=range2.extractContents();
						box.push({
							range:range2,
							df:df,
						});
						console.log(df);
						//このrange2は使用済。参照を断つ
						range2=null;
					}
				}
				//一瞬後（コピー後）に復旧する
				//setImmediateが欲しい事例
				setTimeout(()=>{
					box.reverse();	//連続した奴を消したときに後ろから戻さないと順番が逆になる
					box.forEach(obj=>{
						obj.range.insertNode(obj.df);
						obj.range.detach();
					});
				},0);
			};
			this.container.addEventListener("copy",clistener,false);
		}
		getContainer():HTMLElement{
			return this.container;
		}
		//ログを一つ追加
		getLog(obj:LogObj,initmode:boolean):void{
			//initmode: それがログ初期化段階かどうか
			var line:HTMLElement=this.lineMaker.make(obj);
			this.container.insertBefore(line,this.container.firstChild);
			//音を鳴らす
			if(!initmode && this.userData.volume>0 && this.userData.audioMode != 0){
				//音鳴らす判定を入れる
				//この判定でいいの?
				var style=(<any>document.defaultView).getComputedStyle(line,null);
				if(style.display!=="none"){
					// 音を鳴らし分ける
					if(!obj.syslog){
						//通常ログ
						this.event.emit("logaudio", 0);
					}
					else if(this.userData.audioMode != 2){
						//システム音を鳴らす設定の場合のみ鳴らす
						if(obj.name.indexOf("退室") != -1 || obj.name.indexOf("失踪") != -1) {
							//退室・失踪通知
							this.event.emit("logaudio", 2);
						}
						else{
							//その他のシステムログ
							this.event.emit("logaudio", 1);
						}
					}
				}
			}
		}
		refreshSettings():void{
			//餃子まわりの設定
			//リスナ消去
			this.container.removeEventListener("mouseover",<(e:Event)=>void>this.gyozaOnmouseListener,false);
			if(this.userData.gyoza===1){
				//餃子オンマウスなら再設定
				this.container.addEventListener("mouseover",<(e:Event)=>void>this.gyozaOnmouseListener,false);
			}
		}
		clickHandler(e:Event):void{
			var t=<HTMLElement>e.target;
			var cl=t.classList;
			if(cl.contains("channel") && t.dataset.channel){
				//チャンネルだ
				this.event.emit("focusChannel",t.dataset.channel);
			}else if(cl.contains("respin")){
				if(cl.contains("opened")){
					//ログを戻す
					var bq=<HTMLElement>(<XPathEvaluator>document).evaluate('ancestor::p/following-sibling::blockquote',t,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
					appearAnimation(bq,"vertical",false,true);
				}else if(!cl.contains("processing")){
					//親のログを得る
					var log=<HTMLElement>t.parentNode.parentNode;
					this.receiver.find({
						id:log.dataset.respto,
					},(logs:LogObj[])=>{
						if(logs.length>0){
							var l=logs[0];
							var line:HTMLElement=this.lineMaker.make(l);
							var bq=document.createElement("blockquote");
							bq.classList.add("resp");
							bq.appendChild(line);
							log.parentNode.insertBefore(bq,log.nextSibling);
							appearAnimation(bq,"vertical",true,true,()=>{
								cl.remove("processing");
							});
						}
					});
					cl.add("processing");
				}
				cl.toggle("opened");
				return;
			}
			//ログクリックを検出
			var logp=<HTMLElement>(<XPathEvaluator>document).evaluate('ancestor-or-self::p',t,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null).singleNodeValue;
			if(logp && logp.classList.contains("log")){
				//ログの位置にツールボックス
				if(this.selectedLog!==logp){
					this.selectedLog=logp;
					logp.appendChild(this.toolbox);
					appearAnimation(this.toolbox,"fade",true,true);
				}
			}else{
				//ログをクリックしていない
				//ツールボックス消去
				if(this.toolbox.parentNode){
					appearAnimation(this.toolbox,"fade",false,true);
				}
				this.selectedLog=null;
			}
		}
		//ツールボックス
		private makeToolbox():HTMLElement{
			var toolbox=document.createElement("span");
			toolbox.classList.add("toolbox");
			toolbox.appendChild(makeEl("span",(el)=>{
				el.className="icon resptip";
				el.setAttribute("role","button");
				el.textContent="\ue001";
				el.addEventListener("click",(e:Event)=>{
					var log=this.selectedLog;
					if(log){
						//返信フォーム展開
						this.event.emit("openReplyForm",log);
					}

				},false);
			}));
			toolbox.appendChild(makeEl("span",(el)=>{
				//しまう
				el.className="icon hidetoolbox";
				el.setAttribute("role","button");
				el.textContent="\ue004";
				el.addEventListener("click",(e:Event)=>{
					//クリックするとしまう
					appearAnimation(toolbox,"fade",false,true,()=>{
						this.selectedLog=null;
					});
				},false);
			}));
			return toolbox;
		}
	}
	export class ChatLogDisManager{
		//今フォーカスしているチャネル
		private focusedChannel:string=null;
		private disip:string[]=[];	//disipリスト
		private logContainer:HTMLElement=null;	 //logノード

		constructor(private userData:ChatUserData){
			//disの初期化をする
			userData.disip.forEach((ip:string)=>{
				this.setDisipStyle(ip);
			});
			userData.dischannel.forEach((channel:string)=>{
				this.setDischannelStyle(channel,false,false);
			});
		}
		registerLogContainer(c:HTMLElement):void{
			this.logContainer=c;
		}
		addDisip(ip:string,temporal:boolean=false):boolean{
			var ud=this.userData;
			if(ud.disip.indexOf(ip)>=0)return false;
			if(!temporal){
				ud.disip.push(ip);
				ud.save();
			}
			this.setDisipStyle(ip);
			return true;
		}
		private setDisipStyle(ip:string):void{
			this.addCSSRules([
				'.logbox > p.log[data-ip="'+ip+'"]{display:none}',
				'.users li[data-ip="'+ip+'"]{text-decoration:line-through}',
			]);
		}
		removeDisip(ip:string,temporal?:boolean):void{
			var ud=this.userData;
			if(!temporal){
				ud.disip=ud.disip.filter((x:string)=>{return x!==ip});
				ud.save();
			}
			this.removeCSSRules([
				'.logbox > p.log[data-ip="'+ip+'"]',
				'.users li[data-ip="'+ip+'"]',
			]);
		}
		//-------------- DisChannel API
		//チャネルにフォーカスする（現在のチャネルを返す）
		setFocusChannel(channel:string, toggle:boolean):string{
			var lastChannel:string=this.focusedChannel;
			if(toggle && lastChannel===channel)channel=null;
			this.focusedChannel=channel;
			if(lastChannel!==null){
				this.removeDischannel(lastChannel,true,true);
			}
			if(channel!==null){
				this.addDischannel(channel,true,true);
			}
			return channel;
				
		}
		//disChannel用のcssルールを作る
		//attribute=要素セレクタにつける属性
		private createDisCSSSelector(attribute:string,temporal:boolean,anti:boolean):string{
			if(anti){
				//逆
				attribute=":not("+attribute+")";
			}

			return ".logbox > p.log"+attribute;
		}
		private createDisCSSRule(attribute:string, temporal:boolean,anti:boolean):string{
			var selector:string=this.createDisCSSSelector(attribute,temporal,anti);
			var body= temporal ? "opacity:0.3;" : "display:none;";
			return selector+"{"+body+"}";
		}
		//CSSルールを追加する
		private addCSSRules(cssTexts:string[]):void{
			if(document.styleSheets.length===0){
				//style!
				var style=document.createElement("style");
				document.head.appendChild(style);
			}
			cssTexts.forEach((cssText:string)=>{
				(<CSSStyleSheet>document.styleSheets.item(0)).insertRule(cssText,0);
			});
		}
		private removeCSSRules(cssSelectors:string[]):void{
			var css=<CSSStyleSheet>document.styleSheets.item(0);
			for(var i=css.cssRules.length-1;i>=0;i--){
				var rule=<CSSStyleRule>css.cssRules[i];
				if(cssSelectors.indexOf(rule.selectorText)>=0){
					css.deleteRule(i);
				}
			}
		}
		//disChannelを追加する
		//temporal: 一時的（保存しない） anti:逆（特定のやつ以外dis）
		addDischannel(channel:string,temporal:boolean,anti:boolean):boolean{
			var ud=this.userData;
			if(ud.dischannel.indexOf(channel)>=0)return false;
			if(!temporal){
				ud.dischannel.push(channel);
				ud.save();
			}
			this.setDischannelStyle(channel,temporal,anti);
			return true;
		}
		private setDischannelStyle(channel:string,temporal:boolean,anti:boolean):void{
			this.addCSSRules([
				this.createDisCSSRule('[data-channel*="#'+channel+'/"]',temporal,anti),
			]);
		}
		removeDischannel(channel:string,temporal:boolean,anti:boolean):void{
			var ud=this.userData;
			if(!temporal){
				ud.dischannel=ud.dischannel.filter((x:string)=>x!==channel);
				ud.save();
			}
			this.removeCSSRules([
				this.createDisCSSSelector('[data-channel*="#'+channel+'/"]',temporal,anti),
			]);
		}
		addFocusOutlaw(temporal:boolean):void{
			this.addCSSRules([
				this.createDisCSSRule('[data-channel]',temporal,false),
			]);
		}
		removeFocusOutlaw(temporal:boolean):void{
			this.removeCSSRules([
				this.createDisCSSSelector('[data-channel]',temporal,false),
			]);
		}
	}
	export interface GyazoSettingObject{
		thumb:boolean;  //サムネイル機能ありかどうか
		url:{
			image:string;	//画像のURL（あとにid付加）
			thumbnailUrlGenerator:(string)=>string;	//サムネイルURL生成関数
			ext:boolean;	//?
		};
		text:{
			normal: string;
			opening: string;
			error:string;
		};
	}
	//ログからDOMを生成するやつ
	export class ChatLineMaker{
		//餃子設定
		private gyazoSetting:GyazoSettingObject[] = [
			{
				thumb: true,
				url: {
					image: "https://gyazo.com/",
					thumbnailUrlGenerator: (hash)=>"https://gyazo.com/"+hash+"/raw",
					ext: false,
				},
				text: {
					normal: "[Gyazo]",
					opening: "[Gyoza…]",
					error: "[Gyoza?]",
				}
			},
			{
				thumb: false,
				url: {
					image: "http://myazo.net/",
					thumbnailUrlGenerator: ChatLineMaker.getRegularUrlGenerator("http://myazo.net/s/"),
					ext:true,
				},
				text: {
					normal: "[Myazo]",
					opening: "[Myoza…]",
					error:"[Myoza?]"
				}
			},
			{
				thumb: true,
				url: {
					image: "http://g.81.la/",
					thumbnailUrlGenerator: ChatLineMaker.getRegularUrlGenerator("http://g.81.la/thumb/"),
					ext: false,
				},
				text: {
					normal: "[81g]",
					opening: "[81kg…]",
					error:"[81kg?]",
				}
			}
		];
		private static getRegularUrlGenerator = (url)=>(hash)=>url+hash+".png";
		private mimetexUrl = "http://81.la/cgi-bin/mimetex.cgi";
		constructor(private userData:ChatUserData){
		}
		make(obj:LogObj):HTMLParagraphElement{
			var p=<HTMLParagraphElement>document.createElement("p");
			p.classList.add("log");
			if(obj.syslog){
				//システムログ
				p.classList.add("syslog");
			}
			var color:string=this.getColorByIP(obj.ip); //ログの色
			//名前部分の生成
			var name=el("bdi",obj.name);
			name.classList.add("name");
			name.style.color=color;
			p.appendChild(name);
			//アレ
			p.appendChild(makeEl("span",span=>{
				span.classList.add("nameseparator");
				span.style.color=color;
				span.textContent="> ";
			}));
			//名前以外の部分の生成
			p.appendChild(makeEl("span", main=>{
				main.classList.add("main");
				//返信チップ
				if(obj.response){
					var resptip=document.createElement("span");
					resptip.className="icon respin";
					resptip.textContent="\ue000";
					main.appendChild(resptip);
				}
				//コメント部分の生成
				var comment;
				main.appendChild(makeEl("bdi", bdi=>{
					comment = bdi;
					bdi.appendChild(this.commentHTMLify(obj.commentObject || obj.comment));
					this.parse(bdi,obj);   //解析（URLとか）
					bdi.normalize();
				}));
				//チャネル
				if(obj.channel){
					//コメントにも情報付加
					p.dataset.channel="#"+(Array.isArray(obj.channel) ? obj.channel.join("/#") : obj.channel)+"/";
					//配列か
					var c:string[] = Array.isArray(obj.channel) ? obj.channel : [obj.channel];
					//ログ中のチャネルリンクを抽出
					var sps=comment.getElementsByClassName("channels");
					var chhs=Array.prototype.map.call(sps,function(x:HTMLElement){
						return x.textContent;
					});
					for(var i=0,l=c.length;i<l;i++){
						//ログのチャンネル名と、本文中のハッシュタグがかぶる場合は本文を優先
						if(chhs.indexOf("#"+c[i])===-1){
							main.appendChild(this.makeChannelSpan(c[i]));
						}
					}
				}
				//返信先あり
				if(obj.response){
					p.dataset.respto=obj.response;
					p.classList.add("respto");
				}
				//まとめる
				main.appendChild(makeEl("span", info=>{
					info.classList.add("info");
					var date:Date=new Date(obj.time);
					//日付
					var datestring:string=date.getFullYear()+"-"+zero2(date.getMonth()+1)+"-"+zero2(date.getDate());
					//時刻
					var timestring:string=zero2(date.getHours())+":"+zero2(date.getMinutes())+":"+zero2(date.getSeconds());
					//時間表示
					info.appendChild(makeEl<HTMLTimeElement>("time", time=>{
						time.appendChild(makeEl("span", dateelement=>{
							dateelement.textContent = datestring;
							dateelement.classList.add("date");
						}));
						time.appendChild(makeEl("span", timeelement=>{
							timeelement.textContent = " "+timestring;
							timeelement.classList.add("time");
						}));
						time.appendChild(document.createTextNode("; "));
						time.dateTime=datestring+"T"+timestring;
					}));
					//コメントに付加情報
					p.dataset.id=obj._id;
					p.dataset.ip=obj.ip;
					//IPアドレス情報
					var ipstring:string = obj.ip+(obj.ipff ? " (forwarded for: "+obj.ipff+")" : "");
					info.appendChild(makeEl("span", ipelement=>{
						ipelement.textContent = ipstring+"; ";
						ipelement.classList.add("ip");
					}));
					//なぜか名前にも
					name.title=datestring+" "+timestring+", "+ipstring;

					info.appendChild(makeEl("span", ipelement=>{
						ipelement.textContent = obj._id+"; ";
						ipelement.classList.add("id");
					}));
				}));
				main.style.color=color;
			}));

			return p;

			//補助：中身をきめて作る
			function el(name:string,content:string):HTMLElement{
				var result=document.createElement(name);
				result.textContent=content;
				return result;
			}
			//補助: 2桁に0で埋める
			function zero2(num:number):string{
				return ("00"+num).slice(-2);
			}
		}
		// IPアドレスから色を決める
		getColorByIP(ip:string):string{
			if("string"===typeof ip){
				var arr:string[]=ip.split(/\./);
				return "rgb("+Math.floor(parseInt(arr[0])*0.75)+","+
				Math.floor(parseInt(arr[1])*0.75)+","+
				Math.floor(parseInt(arr[2])*0.75)+")";
			}else{
				return "black";
			}
		}
		//コメントがオブジェクトのときはHTMLにする
		commentHTMLify(comment:any):Node{
			if("string"===typeof comment){
				//テキストならテキストノード
				return document.createTextNode(comment);
			}else if(Array.isArray(comment)){
				//配列のとき：全部つなげる
				var df=document.createDocumentFragment();
				comment.forEach((x:any)=>{
					df.appendChild(this.commentHTMLify(x));
				});
				return df;
			}else{
				//オブジェクトの場合
				//name:要素名 attributes: key-valueのオブジェクト style:key-valueのCSSスタイル
				//child: 中身(CommentObject)
				var elm=document.createElement(comment.name);
				for(var i in comment.attributes){
					elm.setAttribute(i,comment.attributes[i]);
				}
				for(var i in comment.style){
					elm.style.setProperty(i,comment.style[i],null);
				}
				elm.appendChild(this.commentHTMLify(comment.child));
				return elm;
			}
		}
		//チャネル表示
		makeChannelSpan(channel:string):HTMLSpanElement{
			var span=document.createElement("span");
			span.className="channels";
			var wholeChannel:string="";
			var channels:string[]=channel.split("/");
			for(var i=0,l=channels.length;i<l;i++){
				span.appendChild(((i:number,ch:string)=>{
					var span=document.createElement("span");
					span.className="channel";
					if(i===0){
						wholeChannel=ch;
						span.textContent= "#"+ch;
					}else{
						wholeChannel+="/"+ch;
						span.textContent="/"+ch;
					}
					span.dataset.channel=wholeChannel;
					return span;
				})(i,channels[i]));
			}
			return span;
		}
		//ログを解析して追加する
		parse(rawnode:Node,obj:LogObj):void{
			var allowed_tag=["s","small","code","math"];
			if(rawnode.nodeType===Node.TEXT_NODE){
				var node:Text=<Text>rawnode;
				//テキストノード
				if(!node.parentNode)return;
				//先頭から順番に処理
				while(node.nodeValue){
					var res=node.nodeValue.match(/^\[(\w+?)\]/);
					//先頭が開始タグ
					if(res){
						if(allowed_tag.indexOf(res[1])<0){
							//そんなタグはないよ!
							node=node.splitText(res[0].length);
							continue;
						}
						//タグが適用される部分をspanで囲む
						var elem=document.createElement(res[1]=="math" ? "a" : "span");
						elem.classList.add(res[1]);
						//後ろを一旦全部突っ込む
						elem.textContent=node.nodeValue.slice(res[0].length);
						if(!elem.textContent){
							//空だったのでキャンセル.タダのテキストとして分離して次へ
							node=node.splitText(res[0].length);
							continue;
						}
						//処理対象をspanに置き換え
						node.parentNode.replaceChild(elem,node);
						node=<Text>elem.firstChild;
						continue;
					}
					//終了タグ
					res=node.nodeValue.match(/^\[\/(\w+?)\]/);
					if(res){
						if(allowed_tag.indexOf(res[1])<0){
							node=node.splitText(res[0].length);
                            continue;
						}
						//閉じるべきタグを探す
						var p:Node=node;
						while(p=p.parentNode){
							//nodeはテキストノードなので親からスターと
							var cl=(<HTMLElement>p).classList;
							if(cl && cl.contains(res[1])){
								//問題のタグである
								break;
							}
						}
						//タグを閉じる
						if(p){
							var elem = <HTMLElement>p;
							//終了タグを取り除いて、nodeの中には終了タグより右側が残る
							node.nodeValue=node.nodeValue.slice(res[0].length);
							elem.parentNode.insertBefore(node,p.nextSibling);
							if(elem.classList.contains("math")){
								var img=new Image();
								var a = (<HTMLAnchorElement>elem);
								a.href = img.src = this.mimetexUrl+"?"+elem.textContent;
								a.target="_blank";
								elem.textContent="";
								elem.appendChild(img);
							}
						}else{
							//そのタグはなかった。ただのテキストとして処理
							node=node.splitText(res[0].length);
						}
						continue;
					}
					//リンク
					res=node.nodeValue.match(/^https?:\/\/\S+/);
					if(res){
						var matched=false;
						//URLがgyazo系かどうか調べる
						for(var i=0,l=this.gyazoSetting.length;i<l;i++){
							var settingObj:GyazoSettingObject=this.gyazoSetting[i];
							var res2=res[0].match(new RegExp("^"+settingObj.url.image.replace(".","\\.")+"([0-9a-f]{32})(?:\\.png)?"));
							if(!res2) continue;

							//Gyazo
							var a=<HTMLAnchorElement>document.createElement("a");
							a.target="_blank";
							a.href=settingObj.url.image+res2[1]+(settingObj.url.ext?".png":"");
							a.classList.add("gyoza");
							if(settingObj.thumb && this.userData.gyoza===2){
								//餃子常時展開
								this.openGyoza(settingObj,a,res2[1]);
							}else{
								a.textContent=settingObj.text.normal;
							}
							//これは処理終了
							node=node.splitText(res2[0].length);
							//node.previousSiblingは、 splitTextで切断されたurl部分のテキストノード
							node.parentNode.replaceChild(a,node.previousSibling);
							matched=true;
							break;
						}
						if(matched)continue;
						//通常のリンクだった
						var a=<HTMLAnchorElement>document.createElement("a");
						a.href=res[0];
						a.target="_blank";
						try{
							a.textContent=decodeURIComponent(res[0]);
						}catch(e){
							a.textContent=res[0];
						}
						node=node.splitText(res[0].length);
						node.parentNode.replaceChild(a,node.previousSibling);
						continue;
					}
					//チャネルリンク
					res=node.nodeValue.match(/^(\s*\.?)#(\S+)/);
					if(res){
						if(res[1]){
							//前の空白はいらないのでそのまま流す
							node=node.splitText(res[1].length);
						}
						//ログが所属するチャネルと一致する?
						var chs=Array.isArray(obj.channel) ? obj.channel.concat([]) : [];
						var i:number=chs.length;
						if(i>0){
							//長さでソート
							chs.sort((a:string,b:string)=>{
								return a.length-b.length;
							});
						}
						//属していないチャネルに対してもリンクできるようにした
						//前方一致;この部分がチャネル
						var span=this.makeChannelSpan(res[2]);
						//チャネル部分を分離
						node=node.splitText(res[2].length+1);
						node.parentNode.replaceChild(span,node.previousSibling);
						//残りは何もない。流す
						node=node.splitText(0);
						if(i<0){
							//見つからなかった
							node=node.splitText(res[2].length+1);
						}
						continue;
					}
					//その他　上のマークアップが車で通常の文字列
					res=node.nodeValue.match(/^(.+?)(?=\[\/?\w+?\]|https?:\/\/|\s*[ .]#\S+)/);
					if(res){
						node=node.splitText(res[0].length);
						continue;
					}
					//名にもないただのテキスト nodeを空にする
					node=node.splitText(node.nodeValue.length);
				}
			}else if(rawnode.childNodes){
				//elementノード
				var nodes:Node[]=[];
				//途中でchildNodesが変化するので、処理対象のノードをリストアップ
				for(var i=0,l=rawnode.childNodes.length;i<l;i++){
					nodes.push(rawnode.childNodes[i]);
				}
				nodes.forEach((x:Node)=>{
					if(x.parentNode===rawnode)
					this.parse(x,obj);
				});

			}
		}
		//餃子サムネイルを展開する
		openGyoza(settingObj:GyazoSettingObject,a:HTMLAnchorElement,imageid:string):void{
			//a: [Gyazo]リンク	imageid:32桁のやつ
			//まず中を削る
			while(a.hasChildNodes())a.removeChild(a.firstChild);
			//Loading
			//Textをとっておく（あとで取り除くので）
			var text:Text=document.createTextNode(settingObj.text.opening);
			a.appendChild(text);
			//画像設置
			var img=<HTMLImageElement>document.createElement("img");
			img.classList.add("thumbnail");
			img.hidden=true;
			a.appendChild(img);
			//読み込みをまつ
			img.addEventListener("load",(e:Event)=>{
				//文字列を消して画像を表示
				a.removeChild(text);
				img.hidden=false;
			},false);
			//失敗時
			img.addEventListener("error",(e:Event)=>{
				//文字列変更
				text.data=settingObj.text.error;
				//画像除去
				a.removeChild(img);
			},false);
			img.src=settingObj.url.thumbnailUrlGenerator(imageid);
			img.alt=settingObj.url.image+imageid+".png";
			//開いた印
			a.classList.add("gyozaloaded");
		}
		//餃子を判別した上で展開する
		checkGyoza(a:HTMLAnchorElement):void{
			for(var i=0,l=this.gyazoSetting.length;i<l;i++){
				var settingObj=this.gyazoSetting[i];
				if(!settingObj.thumb)continue;
				var result=a.href.match(new RegExp("^"+settingObj.url.image.replace(".","\\.")+"([0-9a-f]{32})(?:\\.png)?$"));
				if(result){
					//これだ!
					this.openGyoza(settingObj,a,result[1]);
				}
			}
		}
	}
	//チャットのユーザー一覧を表示するやつ
	export class ChatUserView{
		private container:HTMLElement;
		private userNumber:HTMLElement;
		private userList:HTMLElement;
		constructor(private receiver:ChatReceiver,private view:ChatView,private dis:ChatLogDisManager){
			this.container=document.createElement("div");
			this.container.classList.add("userinfo");
			//ユーザー数表示部分
			this.userNumber=document.createElement("div");
			this.userNumber.classList.add("usernumber");
			this.userNumber.dataset.roms="0";
			this.userNumber.dataset.actives="0";
			this.container.appendChild(this.userNumber);
			//リスト部分
			this.userList=document.createElement("ul");
			this.userList.classList.add("users");
			this.container.appendChild(this.userList);
			//リストのクリック
			this.userList.addEventListener("click",this.clickHandler.bind(this),false);
			//ユーザー情報を監視
			receiver.on("userinit",this.userinit.bind(this));
			receiver.on("newuser",this.newuser.bind(this));
			receiver.on("deluser",this.deluser.bind(this));
			receiver.on("inout",this.inout.bind(this));
		}
		getContainer():HTMLElement{
			return this.container;
		}
		clickHandler(e:Event):void{
			//ユーザー一覧をクリック
			var t=<HTMLElement>(<HTMLElement>e.target).parentNode;
			if(/li/i.test(t.tagName) && t.dataset.ip){
				if(!this.dis.addDisip(t.dataset.ip)){
					//既にあった=消す
					this.dis.removeDisip(t.dataset.ip);
				}
			}
		}
		//処理用
		userinit(data:{users:UserObj[];roms:number;active:number;}):void{
			//リストの中を初期化
			var r=document.createRange();
			r.selectNodeContents(this.userList);
			r.deleteContents();
			r.detach();
			//数の情報を更新
			this.userNumber.dataset.actives="0";
			this.userNumber.dataset.roms="0";
			data.users.forEach(this.newuser,this);
		}
		//人数をセットして反映
		setusernumber(actives:number,roms:number):void{
			var dataset=this.userNumber.dataset;
			dataset.actives=String(parseInt(dataset.actives)+actives);
			dataset.roms=String(parseInt(dataset.roms)+roms);
			this.userNumber.textContent="入室"+dataset.actives+(dataset.roms!=="0"? " (ROM"+dataset.roms+")":"");
		}
		newuser(user:UserObj):void{
			if(user.rom){
				//romだ!(数だけ変更)
				//rom+1
				this.setusernumber(0, 1);
				return;
			}
			//activeユーザー追加
			this.setusernumber(1, 0);
			this.newuserinfo(user);
		}
		newuserinfo(user:UserObj):void{
			var li:HTMLElement=document.createElement("li");
			var sp:HTMLElement=document.createElement("span");
			sp.textContent=user.name;
			sp.title=user.ip+" / "+user.ua;
			li.dataset.id=String(user.id);
			li.dataset.ip=user.ip;
			li.appendChild(sp);
			this.userList.appendChild(li);
		}
		//誰かがお亡くなりに
		deluser(userid:number):void{
			var elem=this.getUserElement(userid);
			if(!elem){
				//ROMユーザーだろう
				this.setusernumber(0, -1);
				return;
			}
			//アクティブユーザーだ
			this.setusernumber(-1, 0);
			this.userList.removeChild(elem);
		}
		//そのユーザーを表すやつを手に入れる
		getUserElement(id:number):HTMLElement{
			var lis=this.userList.childNodes;
			for(var i=0,l=lis.length;i<l;i++){
				var dataset=(<HTMLElement>lis[i]).dataset;
				if(dataset && dataset.id===String(id)){
					return <HTMLElement>lis[i];
				}
			}
			return null;
		}
		//誰かが入退室した
		inout(user:UserObj):void{
			var elem=this.getUserElement(user.id);
			if(elem){
				//古いのはいらない
				this.userList.removeChild(elem);
			}
			if(user.rom){
				//activeからromになった
				this.setusernumber(-1, 1);
			}else{
				//romからactiveになった
				this.setusernumber(1, -1);
				//用意してあげる
				this.newuserinfo(user);
			}
		}

	}
	//UI
	export class ChatUI{
		//protected
		public container:HTMLElement;
		//protected
		constructor(public userData:ChatUserData,public receiver:ChatReceiver,public process:ChatProcess,public view:ChatView){
		}
		cleanup():void{
			//UI消えるときの後処理
		}
		getContainer():HTMLElement{
			return this.container;
		}
		getView():ChatView{
			return this.view;
		}
		focusComment(focus:boolean,channel?:string):void{
		}
		refreshSettings():void{
		}
	}
	//発言などのUI部分
	export class ChatNormalUI extends ChatUI{
		//private container:HTMLElement;
		//パーツたち
		private inoutForm:ChatUICollection.InoutForm;
		private commentForm:ChatUICollection.CommentForm;

		constructor(userData:ChatUserData,receiver:ChatReceiver,process:ChatProcess,view:ChatView,dis:ChatLogDisManager,channel:string){
			super(userData,receiver,process,view);
			this.container=document.createElement("div");
			this.container.classList.add("ui");
			//フォーム用意
			//まず入退室フォーム
			this.inoutForm=new ChatUICollection.InoutForm(this.userData,this.receiver);
			this.container.appendChild(this.inoutForm.getContainer());
			//次に発言フォーム
			this.commentForm=new ChatUICollection.CommentForm(receiver,false,channel);
			this.container.appendChild(this.commentForm.getContainer());

			//操作に対応する
			this.inoutForm.onInout((data:InoutNotify)=>{
				this.process.inout(data);
			});
			this.commentForm.event.on("comment",(data:CommentNotify)=>{
				this.process.comment(data);
			});
			this.commentForm.event.on("changeChannel",(channel:string)=>{
				dis.setFocusChannel(channel || null, false);
				this.commentForm.event.emit("afterChangeChannel", false);
			});
			this.commentForm.event.on("afterChangeChannel",(on:boolean)=>{
				if(on/* && this.userData.channelMode==0*/){
					dis.addFocusOutlaw(true);
				}else{
					dis.removeFocusOutlaw(true);
				}
			});
		}
		getContainer():HTMLElement{
			return this.container;
		}
		//発言欄にフォーカスする
		focusComment(focus:boolean,channel?:string):void{
			if(focus)this.commentForm.focus();
			this.commentForm.setChannel(channel);
			this.commentForm.event.emit("afterChangeChannel",false);
		}
	}
	//UIパーツ
	export module ChatUICollection{
		export class UIObject{
			//protected
			public event:EventEmitter;
			public container:HTMLElement;
			constructor(){
				this.event=getEventEmitter();
			}
			getContainer():HTMLElement{
				return this.container;
			}
			//inputを作る
			makeinput(callback:(input:HTMLInputElement)=>void):HTMLInputElement{
				var result=<HTMLInputElement>document.createElement("input");
				callback(result);
				return result;
			}
		}
		//入退室フォーム
		export class InoutForm extends UIObject{
			//private event:EventEmitter;
			//private container:HTMLFormElement;
			constructor(private userData:ChatUserData,private receiver:ChatReceiver){
				super();
				this.container=document.createElement("form");
				var cont=<HTMLFormElement>this.container;
				var p:HTMLParagraphElement;

				p=<HTMLParagraphElement>document.createElement("p");
				this.container.appendChild(p);

				//まず名前フォーム
				p.appendChild(this.makeinput(input=>{
					input.name="uname";
					input.size=20;
					input.maxLength=25;
					input.required=true;
					input.placeholder="名前";
					//最初
					input.value = this.userData.name || "";
				}));
				//入退室ボタン
				p.appendChild(this.makeinput(input=>{
					input.name="inoutbutton";
					input.type="submit";
					input.value="入室";
				}));
				//入退室時にフォームがかわる
				this.receiver.on("userinfo",(data:{name:string;rom:boolean;})=>{
					(<HTMLInputElement>cont.elements["uname"]).disabled = !data.rom;
					(<HTMLInputElement>cont.elements["inoutbutton"]).value = data.rom ? "入室" : "退室";
				});
				this.container.addEventListener("submit",(e:Event)=>{
					e.preventDefault();
					this.emitInout(e);
				},false);
			}
			//入退室ボタンが押されたときの処理
			emitInout(e:Event):void{
				var cont=<HTMLFormElement>this.container;
				var data:InoutNotify={
					name:(<HTMLInputElement>cont.elements["uname"]).value,
				};
				this.event.emit("inout",data);
			}
			onInout(func:(data:InoutNotify)=>void):void{
				this.event.on("inout",func);
			}
		}
		//入退室フォーム
		export class CommentForm extends UIObject{
			//public event:EventEmitter;
			//protected:none
			public container:HTMLFormElement;
			private flagFocusOutlaw=false;
			constructor(private receiver:ChatReceiver,private canselable,channel:string){
				//canselable: キャンセルボタンがつく
				super();
				this.container=document.createElement("form");
				this.container.classList.add("commentform");
				var p:HTMLParagraphElement;

				p=<HTMLParagraphElement>document.createElement("p");
				this.container.appendChild(p);

				var us=receiver.getUserinfo();
				//発言欄
				p.appendChild(this.makeinput(input=>{
					input.name="comment";
					input.type="text";
					input.size=60;
					input.autocomplete="off";
					input.required=true;
					input.disabled=us.rom;
					input.addEventListener("input", (e)=>this.emitInput());
				}));
				p.appendChild(document.createTextNode("#"));
				//チャネル欄
				var channelInput;
				p.appendChild(this.makeinput(input=>{
					channelInput = input;
					input.name="channel";
					input.type="text";
					input.size=10;
					input.disabled=us.rom;
					if(channel)input.value=channel;
					input.addEventListener("blur",(e:Event)=>{
						this.event.emit("changeChannel",input.value);
					},false);
					//validate
					input.addEventListener("input",(e:Event)=>{
						if(!input.value || validateHashtag(input.value)){
							input.setCustomValidity("");
						}else{
							input.setCustomValidity("不正なチャネル名です");
						}
					},false);
					input.dataset.autocomplete="/channels";
				}));
				//発言ボタン
				p.appendChild(this.makeinput(input=>{
					input.name="commentbutton";
					input.type="submit";
					input.value="発言";
					input.disabled=us.rom;
				}));
				this.receiver.on("userinfo",(data:{name:string;rom:boolean;})=>{
					["comment","channel","commentbutton"].forEach(x=>{
						(<HTMLInputElement>this.container.elements[x]).disabled = data.rom;
					});
				});
				this.container.addEventListener("submit",(e:Event)=>{
					e.preventDefault();
					this.emitComment(e);
					this.emitInput();
					this.event.emit("changeChannel",channelInput.value); // hack
				},false);
				if(canselable){
					//キャンセルボタン
					p.appendChild(this.makeinput(input=>{
						input.name="canselbutton";
						input.type="button";
						input.value="キャンセル";
						input.addEventListener("click",(e:Event)=>{
							this.event.emit("cancel");
						},false);
					}));
				}

				// inputが描画されてから起動
				setTimeout(function(){
					new AutoComplete({}, channelInput)
				}, 0);

				function validateHashtag(channel:string):boolean{
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
			}
			//入退室ボタンが押されたときの処理
			emitComment(e:Event):void{
				var form=this.container;
				//チャネル
				var channel:string[]=null;
				var channelvalue:string=(<HTMLInputElement>form.elements["channel"]).value;
				if(channelvalue){
					channel=[channelvalue];
				}
				var data:CommentNotify={
					comment:(<HTMLInputElement>form.elements["comment"]).value,
					response:null,
					channel:channel,
				};
				this.event.emit("comment",data);
				//フォームを消す
				(<HTMLInputElement>form.elements["comment"]).value="";
			}
			//コメント欄が変わった時の処理
			//outlaw(タグがない発言)への注目処理
			emitInput():void{
				if(this.getChannel()!=""){
					//チャネルが指定されている場合はオンにしない
					if(this.flagFocusOutlaw){
						//オンなときはオフにする
						this.flagFocusOutlaw=false;
						this.event.emit("afterChangeChannel",false);
					}
					return;
				}
				var nowCommentEmpty=(<HTMLInputElement>this.container.elements["comment"]).value.length==0;
				if((this.flagFocusOutlaw && nowCommentEmpty) || (!this.flagFocusOutlaw && !nowCommentEmpty)){
					this.event.emit("afterChangeChannel",!nowCommentEmpty);
				}
				this.flagFocusOutlaw=!nowCommentEmpty;
			}
			//フォーカスする(チャネル指定可能）
			focus():void{
				(<HTMLInputElement>this.container.elements["comment"]).focus();
			}
			setChannel(channel?:string):void{
				(<HTMLInputElement>this.container.elements["channel"]).value= channel ? channel : "";
			}
			getChannel():string{
				return (<HTMLInputElement>this.container.elements["channel"]).value;
			}
		}
		export class MottoForm extends UIObject{
			//private event:EventEmitter;
			//private container:HTMLFormElement;
			constructor(){
				super();
				this.container=<HTMLFormElement>document.createElement("form");
				var p:HTMLParagraphElement;

				p=<HTMLParagraphElement>document.createElement("p");
				this.container.appendChild(p);
				//HottoMottoButton
				p.appendChild(this.makeinput((input)=>{
					input.type="submit";
					input.value="HottoMotto";
				}));

				this.container.addEventListener("submit",(e:Event)=>{
					e.preventDefault();
					this.emitMotto(e);
				},false);
			}
			//入退室ボタンが押されたときの処理
			emitMotto(e:Event):void{
				var data:MottoNotify={
				};
				this.event.emit("motto",data);
			}
			onMotto(func:(data:MottoNotify)=>void):void{
				this.event.on("motto",func);
			}
		}
		//コマンドライン用コンソール
		export class Console extends UIObject{
			//private event:EventEmitter;
			//private container:HTMLElement;
			private consoleo:HTMLElement;
			private command:HTMLInputElement;
			private commandtopelement:HTMLElement;
			private cmode:string;
			private cmdprocess:ChatCmdProcessCollection.Process;
			private commandlog:string[]=[];
			private commandlogindex:number=null;
			private indentSpace:string="";
			private saves:DocumentFragment[]=[];
			constructor(private userData:ChatUserData,private receiver:ChatReceiver,private process:ChatProcess,private ui:ChatUI){
				super();
				this.cmode="down";	  //up:新しいログ上へ、down:下へ
				this.makeConsole();
				this.cmdprocess=null;
			}
			//コンソール初期化
			makeConsole():void{
				//コンテナ=コンソール画面
				this.container=document.createElement("div");
				this.container.classList.add("console");
				setUniqueId(this.container,"console");
				this.setHeight(this.userData.cmd.height);
				this.consoleo=document.createElement("pre");
				this.consoleo.classList.add("consoleoutput");
				this.container.appendChild(this.consoleo);
				//入力部分を作る
				var p=document.createElement("p");
				this.command=<HTMLInputElement>document.createElement("input");
				this.commandtopelement=document.createElement("span");
				this.commandtopelement.textContent="> ";
				p.appendChild(this.commandtopelement);
				p.appendChild(this.command);
				if(this.cmode==="up"){
					this.container.insertBefore(p,this.consoleo);
				}else{
					this.container.appendChild(p);
				}
				//クリックされると入力フォーカス
				this.container.addEventListener("click",(e:Event)=>{
					this.focusConsole();
				},false);
				//キーを捕捉する
				var handler=this.keydown.bind(this);
				document.addEventListener("keydown",handler,false);
				//後始末
				this.event.on("exit",()=>{
					document.removeEventListener("keydown",handler,false);
				});
			}
			//自分も始末する
			cleanup():void{
				this.event.emit("exit");
				setTimeout(()=>{
					if(this.container.parentNode)this.container.parentNode.removeChild(this.container);
				},350);
			}
			//キーを・・・
			keydown(e:KeyboardEvent):void{
				//プロセスに送る
				if(this.cmdprocess){
					if(!this.cmdprocess.gotKey(e)){
						e.preventDefault();
						return;
					}
				}
				var act=document.activeElement;
				if(/^input|button$/i.test(act.tagName) && act!==this.command){
					//邪魔しない
					return;
				}
				if(e.keyCode===13 || e.keyCode===27){
					//Enter,Esc
					if(!this.container.classList.contains("open")){
						//開く
						this.openConsole();
						e.preventDefault();
						return;
					}else if(this.command.value===""){
						//閉じる
						this.closeConsole();
						e.preventDefault();
						return;
					}
				}
				if(e.keyCode===13 && !this.cmdprocess){
					//コマンド実行
					this.execCommand(this.command.value);
					this.command.value="";
					this.focusConsole();
					e.preventDefault();
					return;
				}
				//コマンド履歴をスクロールする
				if((e.keyCode===38 || e.keyCode===40)&& this.command===document.activeElement && this.container.classList.contains("open")){
					//上下
					if(this.commandlogindex==null){
						this.commandlogindex=this.commandlog.length-1;
					}else if(e.keyCode===38){
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
			openConsole():void{
				this.container.classList.add("open");
				this.focusConsole();
			}
			closeConsole():void{
				this.container.classList.remove("open");
				this.command.blur();
				this.event.emit("close");
			}
			onClose(func:()=>void):void{
				this.event.on("close",func);
			}
			focusConsole():void{
				//コンソールにフォーカスする
				//コマンドにフォーカスするとスクロールしてしまうので一時的にスクロール位置保存
				var sc=document.documentElement.scrollTop || document.body.scrollTop;
				this.command.focus();
				//戻す
				document.documentElement.scrollTop && (document.documentElement.scrollTop=sc);
				document.body.scrollTop && (document.body.scrollTop=sc);
			}
			setHeight(height:string):void{
				if(!height)height="30em";
				var st=<CSSStyleSheet>document.styleSheets.item(0);
				st.insertRule("#"+this.container.id+" { height: "+height+"; bottom:-"+height+"}",st.cssRules.length);
			}
			openInput(topstr?:string):void{
				if(topstr!=null){
					this.commandtopelement.textContent = topstr ? topstr+" " : "";
				}
				this.command.disabled=false;
				(<HTMLElement>this.command.parentNode).hidden=false;
			}
			hideInput():void{
				this.command.disabled=true;
				(<HTMLElement>this.command.parentNode).hidden=true;
			}
			setInput(str:string):void{
				this.command.value=str;
			}
			getInput():string{
				return this.command.value;
			}
			//一番下を見せる
			scrollDown():void{
				this.container.scrollTop= this.container.scrollHeight - this.container.clientHeight;
			}
			execCommand(line:string):void{
				var syschar:string=this.userData.cmd.syschar;
				var result=line.match(new RegExp("^\\"+syschar+"(\\S+)\\s*"));
				if(!result && line){
					//通常の発言
					var data:CommentNotify={
						comment:line,
						response:null,
						channel:null,
					};
					this.process.comment(data);
					return;
				}
				//履歴にコマンドを追加する
				this.addCommandLog(line);
				this.print("> "+line);
				//命令・スペースを除去する
				line=line.slice(result[0].length);
				var errorMessage=this.runCommand(result[1],line);
				if(errorMessage){
					this.print(errorMessage,{color:"red"});
				}
			}
			//返り値: error message
			runCommand(name:string,args:string):string{
				var c:new(ui:ChatUI,console:ChatUICollection.Console,process:ChatProcess,userData:ChatUserData,arg:string)=>ChatCmdProcessCollection.Process=null;
				//選択
				if(name==="in"){
					c=ChatCmdProcessCollection.In;
				}else if(name==="out"){
					c=ChatCmdProcessCollection.Out;
				}else if(name==="motto"){
					c=ChatCmdProcessCollection.Motto;
				}else if(name==="volume"){
					c=ChatCmdProcessCollection.Volume;
				}else if(name==="gyoza" || name==="gyazo"){
					c=ChatCmdProcessCollection.Gyoza;
				}else if(name==="set"){
					c=ChatCmdProcessCollection.Set;
				}else if(name==="clear" || name==="clean"){
					c=ChatCmdProcessCollection.Clean;
				}else if(name==="help"){
					c=ChatCmdProcessCollection.Help;
				}else if(name==="go"){
					c=ChatCmdProcessCollection.Go;
				}else if(name==="disip"){
					c=ChatCmdProcessCollection.Disip;
				}else if(name==="dischannel"){
					c=ChatCmdProcessCollection.Dischannel;
				}else if(name==="sl"){
					c=ChatCmdProcessCollection.Sl;
				}


				if(c){
					var p:ChatCmdProcessCollection.Process=new c(this.ui,this,this.process,this.userData,args);
					this.cmdprocess=p;
					p.run();
					return null;
				}else{
					return "Unknown command: "+name;
				}
			}
			//コマンド終了
			endProcess():void{
				this.cmdprocess=null;
				this.openInput(">");
			}
			addCommandLog(line:string):void{
				this.commandlog.push(line);
				//古いほうを消す
				if(this.commandlog.length>50){
					this.commandlog.shift();
				}
				this.commandlogindex=null;
			}
			//コンソールに文字出力
			print(str:string,option?:any):void{
				//改行付き
				this.put(str+"\n",option);
			}
			//生
			put(str:string,option?:any):void{
				//まずインデント設定
				if(this.indentSpace.length>0){
					str=str.split("\n").map((x:string,i:number)=>{
						return i>0 && x ? this.indentSpace+x : x;
					}).join("\n");
					//行頭インデント

					if(this.cmode==="up"){
						var con=this.consoleo.textContent;
						if(con.length===0 || con.charAt(0)==="\n"){
							//最初にもインデント必要
							str=this.indentSpace+str;
						}
					}else{
						if(con.length===0 || con.charAt(con.length-1)==="\n"){
							str=this.indentSpace+str;
						}
					}
				}
				if(this.cmode==="up"){
					//改行で分ける
					var lines:string[]=str.split("\n");
					var df=document.createDocumentFragment();	//2行め以降をまとめておく
					var first=lines.shift();
					//逆順か
					lines.reverse();
					var remains=lines.join("\n");
					if(remains){
						df.appendChild(makeNode(remains,option));
					}
					//いい位置を探す
					var tw=document.createTreeWalker(this.consoleo,NodeFilter.SHOW_TEXT,(node:Text)=>{
						return NodeFilter.FILTER_ACCEPT;
					},false);
					var node:Text;
					while(node=<Text>tw.nextNode()){
						var idx=node.data.lastIndexOf("\n");
						if(idx<0){
							//改行がない
							continue;
						}
						//改行があった!改行の後ろに追加する
						var range=document.createRange();
						range.setStart(this.consoleo,0);	//出力の一番最初
						range.setEnd(node,idx); //改行の直前まで
						//改行の前までを抜き出す
						var c=range.extractContents();
						//間にはさんで追加する
						this.consoleo.insertBefore(makeNode(first,option),this.consoleo.firstChild);
						//戻す
						this.consoleo.insertBefore(c,this.consoleo.firstChild);
						range.detach();
						break;
					}
					if(!node){
						//入れられなかった
						this.consoleo.appendChild(node);
					}
					//残り
					this.consoleo.insertBefore(df,this.consoleo.firstChild);
					this.consoleo.normalize();
				}else{
					//下に追加するだけじゃん!
					this.consoleo.appendChild(makeNode(str,option));
					this.consoleo.normalize();
					this.scrollDown();
				}
				//テキストをラップする
				function makeNode(text:string,option?:any):Node{
					var ins:Node;
					if(!option){
						ins=document.createTextNode(text);
					}else{
						ins=document.createElement("span");
						ins.textContent=text;
						//cssプロパティ
						for(var key in option){
							if(option[key]!=null){
								(<HTMLElement>ins).style.setProperty(key,option[key],null);
							}
						}
					}
					return ins;
				}
			}
			indent(num:number,callback:()=>void):void{
				//内部を印伝として表示
				var t=this;
				setindent(num);
				callback();
				setindent(-num);

				function setindent(n:number):void{
					if(n>0){
						for(var i=0;i<n;i++){
							t.indentSpace+=" ";
						}
					}else if(n<0){
						t.indentSpace=t.indentSpace.slice(-n);
					}
				}
			}
			//行削除(num: 後ろから何行消すか）
			deletelines(num?:number):void{
				if(num==null){
					this.consoleo.textContent="";
					return;
				}
				if(num<=0)return;
				var tw=document.createTreeWalker(this.consoleo,NodeFilter.SHOW_TEXT,(node:Text)=>{
					return NodeFilter.FILTER_ACCEPT;
				},false);
				var node:Text, count:number=num;
				var range=document.createRange();
				range.selectNodeContents(this.consoleo);
				if(this.cmode==="up"){
					//前から
					if(this.consoleo.textContent.charAt(0)==="\n"){
						count++;
					}

					big:while(node=<Text>tw.nextNode()){
						var idx:number=0;
						while((idx=node.data.indexOf("\n",idx))>=0){
							//改行 みつけた
							count--;
							if(count<=0){
								range.setEnd(node,idx); //改行の手前まで
								break big;
							}
						}
					}
					//breakしなかったら最後まで消すのだ
				}else{
					//後ろから
					var cono=this.consoleo.textContent;
					if(cono.charAt(cono.length-1)==="\n"){
						count++;
					}
					big:while(node=<Text>tw.previousNode()){
						var idx:number=0;
						while((idx=node.data.lastIndexOf("\n",idx))>=0){
							//改行
							count--;
							if(count<=0){
								range.setStart(node,idx+1); //改行の直後まで
								break big;
							}
						}
					}
				}
				//中身を抜く
				range.deleteContents();
				range.detach();
			}
			newContext():void{
				//前のをとっておいて出力を空に
				var range=document.createRange();
				range.selectNodeContents(this.consoleo);
				this.saves.push(range.extractContents());
				range.detach();
			}
			restoreContext():void{
				var range=document.createRange();
				range.selectNodeContents(this.consoleo);
				range.deleteContents();
				range.insertNode(this.saves.pop());
				range.detach();
			}
		}
	}
	//コマンドライン用プロセス
	export module ChatCmdProcessCollection{
		export interface Arg{
			active:boolean;	//false: 省略された
			option:boolean;	//false: ただの引数 true: オプション
			value:string;
			params?:string[];	//オプションの引数たち
		}
		export interface ArgRequest{
			//argひとつの形式を定める
			option:boolean;
			name?:string[];   //optionのときにオプション名
			num?:number;	//optionのときに可能な数
		}
		export class Process{
			//want protected
			public key:(e:KeyboardEvent)=>boolean=null;
			//protectedが欲しい事例
			constructor(public ui:ChatUI,public console:ChatUICollection.Console,public process:ChatProcess,public userData:ChatUserData,public arg:string){
			}
			//引数を配列に分けて返す
			parseArg(...reqs:ArgRequest[]):Arg[]{
				var a=this.arg;
				var result:Arg[]=[];
				//まず単語に分解
				var words:string[]=[];
				while(a=a.replace(/^\s+/,"")){
					var r;
					if(a.charAt(0)==='"'){
						// "囲み
						r=a.match(/^\"(?:[^\"]|\\")*\"(?=\s+|$)/);
						if(r){
							//囲まれた
							words.push(r[0]);	//""ごと
							a=a.slice(r[0].length);
							continue;
						}
					}else if(a.charAt(0)==="'"){
						r=a.match(/^\'(?:[^\"]|\\')*\'(?=\s+|$)/);
						if(r){
							//囲まれた
							words.push(r[0]);	//""ごと
							a=a.slice(r[0].length);
							continue;
						}
					}
					//ダメだったら空白まで
					r=a.match(/^\S+/);
					if(r){
						words.push(r[0]);
						a=a.slice(r[0].length);
					}
				}
				//wordsと引数をてらしあわす
				var addto:Arg=null,addremain:number=null;
				for(var i=0,l=words.length;i<l;i++){
					var word=words[i];
					//対応する引数探す
					//まずoptionの
					for(var j=0,m=reqs.length;j<m;j++){
						var req:ArgRequest=reqs[j];
						if(!result[j] && req.option){
							if(req.name.indexOf(word)>=0){
								addremain=req.num || 0;
								result[j]={
									active:true,
									option:true,
									value:word,
									params:[]
								};
								if(addremain){
									//追加モード
									addto=result[j];
								}else{
									//通常通り
									addto=null;
								}
								words.splice(i,1);
								i--,l--;
								break;
							}
						}
					}
					if(j===m){
						//見つからなかった（ただの引数）
						if(addremain && addto){
							word=normalize(word);
							addto.params.push(word);
							addremain--;
							words.splice(i,1);
							i--,l--;
						}
					}
				}
				//一周目終了。残りを埋める
				for(var j=0,m=reqs.length;j<m;j++){
					if(result[j])continue;	//処理終了した
					var req=reqs[j];
					if(!req.option){
						for(i=0;i<l;i++){
							var word=words[i];
							result[j]={
								active:true,
								option:false,
								value:normalize(word),
							};
							words.splice(i,1);
							i--,l--;
							break;
						}
					}else{
						result[j]={
							active:false,
							option:true,
							value:req.name[0],
							params:[],
						};
					}
				}
				//最後に省略引数の処理
				for(var j=0,m=reqs.length;j<m;j++){
					if(!result[j]){
						var req=reqs[j];
						result[j]={
							active:false,
							option:req.option,
							value: req.option ? req.name[0] : null,
						};
					}
				}
				return result;
				function normalize(word:string):string{
					//""などを取り除く
					var r;
					if(r=word.match(/^\"(.*)\"$/)){
						return r[1];
					}
					if(r=word.match(/^\'(.*)\'$/)){
						return r[1];
					}
					return word;
				}
			}
			gotKey(e:KeyboardEvent):boolean{
				if(!this.key)return true;	//妨げない
				return this.key(e);
			}
			//コンソール操作系
			print(str:string,option?:any):void{
				this.console.print(str,option);
			}
			put(str:string,option?:any):void{
				this.console.put(str,option);
			}
			//エラー表示
			error(str:string,option:any={}):void{
				option.color="#ff6666";
				this.print(str,option);
			}
			indent(num:number,callback:()=>void):void{
				this.console.indent(num,callback);
			}
			//行単位入力
			input(multiline:boolean,callback:(str:string)=>void):void{
				//multiline:複数行対応
				this.console.openInput("");
				var result="";
				this.key=(e:KeyboardEvent)=>{
					if(e.keyCode===13){
						//Enter=行
						var inp=this.console.getInput();
						this.print(inp);
						result+=inp+"\n";
						this.console.setInput("");
						this.console.focusConsole();
						if(!multiline || !e.shiftKey){
							//終了
							this.console.hideInput();
							this.key=null;
							callback(result);
						}
						return false;
					}
					return true;
				};
			}
			//キー単位入力
			inputKey(callback:(e:KeyboardEvent)=>boolean):void{
				this.console.openInput("");
				this.key=(e:KeyboardEvent)=>{
					e.preventDefault();
					if(!callback(e)){
						this.key=null;
					}
					return false;
				};
			}
			//走る
			run():void{
			}
			//終了
			die():void{
				this.console.endProcess();
			}
			//末尾の改行をけす
			chomp(str:string):string{
				return str.replace(/\n+$/,"");
			}
		}
		//コマンドの実装
		export class In extends Process{
			run():void{
				var args=this.parseArg({
					option:false,
				},{
					option:true,
					name:["--auto"],
					num:0,
				},{
					option:true,
					name:["--noauto"],
					num:0,
				});
				if(args[1].active){
					//autoin
					this.userData.autoin=true;
					this.userData.save();
					this.print("autoin set.");
				}else if(args[2].active){
					this.userData.autoin=false;
					this.userData.save();
					this.print("autoin unset.");
				}
				//入室
				var data:InoutNotify={
					name:null,
				};
				if(args[0].active){
					//名前がある
					data.name=args[0].value;
				}else if(this.userData.name){
					data.name=this.userData.name;
				}else{
					//名前がない
					this.error("Name required.");
					this.die();
					return;
				}
				var result:boolean=this.process.inout(data,"in");
				if(!result){
					//失敗
					this.error("You are already in the room.");
				}
				this.die();
			}
		}
		export class Out extends Process{
			run():void{
				//入室
				var data:InoutNotify={
					name:null,
				};
				var result:boolean=this.process.inout(data,"out");
				if(!result){
					//失敗
					this.error("You are not in the room.");
				}
				this.die();
			}
		}
		export class Motto extends Process{
			run():void{
				//日時
				var args=this.parseArg({
					option:false,
				},{
					option:true,
					name:["--gmt","--utc"],
					num:0,
				});
				//リクエストを作る
				var untiltime:number=null;
				if(args[0].active){
					//日時指定あり
					untiltime=(new Date(args[0].value)).getTime();
					if(!isNaN(untiltime)){
						if(!args[1].active){
							//ローカル時間なのでずらす
							untiltime+=(new Date).getTimezoneOffset()*60000;
						}
					}
				}
				var data:MottoNotify={
				};
				if(untiltime){
					data.until=new Date(untiltime);
				}
				this.process.motto(data);
				this.die();
			}
		}
		export class Volume extends Process{
			run():void{
				var args=this.parseArg({
					option:false,
				});
				//ボリューム変更
				if(!args[0].active){
					//教えるだけ
					this.print(String(this.userData.volume));
					this.die();
					return;
				}
				var vo=parseInt(args[0].value);
				if(isNaN(vo) || vo<0 || 100<vo){
					this.error("Invalid volume "+args[0].value);
				}else{
					this.userData.volume=vo;
					this.userData.save();
					this.ui.getView().refreshSettings();
				}
				this.die();
			}
		}
		export class Gyoza extends Process{
			run():void{
				var args=this.parseArg({
					option:false,
				});
				//餃子モード変更
				if(args[0].active){
					var mo=parseInt(args[0].value);
					if(isNaN(mo) || mo<0 || 2<mo){
						this.error("Invalid gyoza: "+args[0].value);
					}else{
						this.userData.gyoza=mo;
						this.userData.save();
						this.ui.getView().refreshSettings();
					}
				}
				//餃子状態を表示してあげる
				["餃子無展開","餃子オンマウス","餃子常時"].forEach((x:string,i:number)=>{
					if(this.userData.gyoza===i){
						this.put("*"+i,{color:"#00ffff"});
					}else{
						this.put(" "+i);
					}
					this.print(": "+x);
				});
				this.die();
			}
		}
		export class Set extends Process{
			run():void{
				var args=this.parseArg({
					option:false,
				},{
					option:false,
				});
				if(!args[1].active){
					//keyがない
					this.error("Value is required.");
					this.die();
					return;
				}
				var key=args[0].active ? args[0].value : null;
				var value=args[1].value;
				//複数の設定を変更できる
				switch(key){
					case "syschar":case "systemchar":
						//命令文字
						if(value.length!==1){
							this.error("set "+key+": invalid char "+value);
							break;
						}
						this.userData.cmd.syschar=value;
						this.userData.save();
						break;
					case "height":
						//コンソール高さ
						var vn=parseFloat(value);
						if(isNaN(vn) || vn<0){
							this.error("set "+key+": invalid value "+value);
							break;
						}
						this.userData.cmd.height=value+"em";
						this.userData.save();
						this.console.setHeight(value+"em");
						break;
					default:
						this.error("Unknown setting: "+key);
						break;
				}
				this.die();
			}
		}
		export class Clean extends Process{
			run():void{
				//コンソール掃除
				this.console.deletelines();
				this.die();
			}
		}
		export class Help extends Process{
			run():void{
				//ヘルプメッセージ
				this.print([
"command usage: "+this.userData.cmd.syschar+"command",
"in [name] [--auto] [--noauto]",
"	 enter the chatroom",
"	 --auto: auto-enter at the next time",
"	 --noauto: don't auto-enter",
"out",
"	 quit the chatroom",
"motto [until] [--gmt] [--utc]",
"	 HottoMotto",
"	   until(if exists): ex) 2012-01-01, 2013-01-01T00:00",
"volume [number]",
"	 show/set volume",
"set (param) (value)",
"	 set syschar/systemchar",
"		 height",
"gyazo [num], gyoza [num]",
"	 show/set gyoza mode",
"clear, clean",
"	 clean the console",
"disip [-d] [ip] ",
"	 set/remove ip into/from disip list",
"dischannel [-d] [channel]",
"	 set/remove channel into/from dischannel list",
"go [URL|alias|#channelname]",
"	 alias: 'wiki'",
		].join("\n"));
				this.die();
			}
		}
		export class Go extends Process{
			run():void{
				var args=this.parseArg({
					option:false
				});
				if(!args[0].active){
					this.die();
					return;
				}
				var dest=args[0].value;
				//alias
				if(dest==="wiki"){
					dest="http://showigiki.81.la/shogiwiki/";
				}else{
					//チャネル
					var result=dest.match(/^#(\S+)$/);
					if(result){
						this.process.openChannel(result[1]);
						this.die();
						return;
					}
				}
				//URLへ
				var a=<HTMLAnchorElement>document.createElement("a");
				a.href=dest;
				a.target="_blank";
				a.click();
				this.die();
			}
		}
		export class Disip extends Process{
			run():void{
				var args=this.parseArg({
					option:false,
				},{
					option:true,
					name:["-d"],
					num:0,
				},{
					option:true,
					name:["--clean"],
					num:0,
				});
				var dis=this.ui.getView().dis;
				if(args[0].active){
					//disipに追加
					var ip=args[0].value;
					if(args[1].active){
						//やっぱり削除
						dis.removeDisip(ip);
					}else{
						if(!dis.addDisip(ip)){
							//失敗=すでにある
							this.error("Already exists: "+ip);
						}
					}
				}
				if(args[2].active){
					//全て削除
					var diss=this.userData.disip.concat([]);
					diss.forEach((ip:string)=>{
						dis.removeDisip(ip);
					});
				}
				//disip一覧を表示
				this.userData.disip.forEach((ip:string)=>{
					this.print(ip);
				});
				this.die();
			}
		}
		export class Dischannel extends Process{
			run():void{
				var args=this.parseArg({
					option:false,
				},{
					option:true,
					name:["-d"],
					num:0,
				},{
					option:true,
					name:["--clean"],
					num:0,
				});
				var dis=this.ui.getView().dis;
				if(args[0].active){
					//dischannelに追加
					var channel=args[0].value;
					if(/^#\S+$/.test(channel)){
						//#を除く
						channel=channel.slice(1);
					}
					if(args[1].active){
						//やっぱり削除
						dis.removeDischannel(channel,false,false);
					}else{
						if(!dis.addDischannel(channel,false,false)){
							//失敗=すでにある
							this.error("Already exists: "+channel);
						}
					}
				}
				if(args[2].active){
					//全て削除
					var diss=this.userData.dischannel.concat([]);
					diss.forEach((channel:string)=>{
						dis.removeDischannel(channel,false,false);
					});
				}
				//dischannel一覧を表示
				this.userData.dischannel.forEach((channel:string)=>{
					this.print(channel);
				});
				this.die();
			}
		}
		export class Sl extends Process{
			run():void{
				var sl_steam=[
		["						(@@) (	) (@)  ( )	@@	  ()	@	  O		@	  O		 @",
		"				  (   )",
		"			  (@@@@)",
		"		   (	)",
		"",
		"		 (@@@)",
		],
		[
		"					   (  ) (@@) ( )  (@)  ()	 @@    O	 @	   O	 @		O",
		"				  (@@@)",
		"			  (    )",
		"		   (@@@@)",
		"",
		"		 (	 )",
		]
				],sl_body=[
		"	   ====		   ________				   ___________ ",
		"  _D _|  |_______/		   \\__I_I_____===__|_________| ",
		"	|(_)---  |	 H\\________/ |   |		   =|___ ___|	   _________________		 ",
		"	/	  |  |	 H	|  |	 |	 |		   ||_| |_||	 _|				   \\_____A  ",
		"  |	  |  |	 H	|__--------------------| [___] |   =|						 |	",
		"  | ________|___H__/__|_____/[][]~\\_______|		|	-|						  |  ",
		"  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_ ",
				],sl_wheels=[
		[
		"__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__|__________________________|_ ",
		" |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
		"  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
		],[
		"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
		" |/-=|___|=O=====O=====O=====O   |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
		"  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
		],[
		"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
		" |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
		"  \\_/		 \\O=====O=====O=====O_/	  \\_/				 \\_/	\\_/	\\_/   \\_/    ",
		],[
		"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
		" |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
		"  \\_/		 \\_O=====O=====O=====O/	  \\_/				 \\_/	\\_/	\\_/   \\_/    ",
		],[
		"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
		" |/-=|___|=   O=====O=====O=====O|_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
		"  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
		],[
		"__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__|__________________________|_ ",
		" |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
		"  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
		],
				];

				var counter=0,position=0,sl_length=90,sp_length=30;
				var sl_speed=90;	//wait長さ
				var spaces="";
				for(var i=0;i<sp_length;i++){
					spaces+=" ";	//スペースを作る
				}
				var le=0;	//減った
				var console=this.console, t=this;
				console.newContext();
				console.hideInput();
				this.key=(e:KeyboardEvent)=>false;
				sl_move();
				function sl_move(){
					if(counter){
						//2かいめ以降
						console.deletelines(16);	//16行
					}
					var wheel=counter%6;	//6 patterns
					var steam=Math.floor(counter/3)%2;
					var cut=function(x:string):string{return spaces+x.slice(le)};
					console.print(sl_steam[steam].concat(sl_body,sl_wheels[wheel]).map(cut).join("\n"));
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
						console.restoreContext();
						t.key=null;
						t.die();
					}
				}
			}
		}
	}
	//コマンドラインみたいなUI
	export class ChatCmdUI extends ChatUI{
		private console:ChatUICollection.Console;
		private userinfoHandle:Function;
		constructor(userData:ChatUserData,receiver:ChatReceiver,process:ChatProcess,view:ChatView,dis:ChatLogDisManager){
			super(userData,receiver,process,view);
			this.console=new ChatUICollection.Console(userData,receiver,process,this);
			receiver.on("userinfo",this.userinfoHandle=(data:any)=>{
				if(!data.rom && data.name){
					this.console.print("Hello, "+data.name,{color:"#ffff00"});
				}
			});
		}
		cleanup():void{
			this.receiver.removeListener("userinfo",this.userinfoHandle);
			this.console.cleanup();
		}
		getConsole():ChatUICollection.Console{
			return this.console;
		}
		getContainer():HTMLElement{
			return this.console.getContainer();
		}
	}
	//その他util
	function setUniqueId(element:HTMLElement,base:string):void{
		if(!document.getElementById(base)){
			element.id=base;
			return;
		}
		var number=0;
		while(document.getElementById(base+number))number++;
		element.id=base+number;
		return;
	}
	function appearAnimation(el:HTMLElement,mode:string,appear:boolean,finish:boolean,callback:()=>void=function(){}):void{
		//transition heightが設定してあることが前提
		//mode:"vertical","horizontal","fade"
		//appear: true->出現 false->消滅
		//finish: 終了時に後処理をするかどうか(appear:true->スタイルを消す, appear:false->スタイルを消して親から消す)
		//DOMツリーに追加してから呼ぶ(スタイル反映）
		//とっておく
		//computedStyle取得
		var cmp=(<any>el.ownerDocument.defaultView).getComputedStyle(el,null);
		if(!cmp.transition){
			if(!appear && finish){
				if(el.parentNode){
					el.parentNode.removeChild(el);
				}
			}
			callback();
			return;  //未対応
		}
		//クラス付加
		var inb1:boolean, inb2:boolean;
		var h:number;
		if(mode==="vertical"){
			inb1=el.classList.contains("verticalanime1");
			el.classList.add("verticalanime1");
			h=el.clientHeight;
			if(appear){
				el.style.height="0";
			}else{
				el.style.height=h+"px";
			}
		}else if(mode==="horizontal"){
			inb1=el.classList.contains("horizontalanime1");
			el.classList.add("horizontalanime1");
			h=el.clientWidth;
			if(appear){
				el.style.width="0";
			}else{
				el.style.width=h+"px";
			}
		}else if(mode==="fade"){
			inb1=el.classList.contains("fadeanime1");
			el.classList.add("fadeanime1");
			if(appear){
				el.style.opacity="0";
			}else{
				el.style.opacity="1";
			}
		}
		//setImmediateがほしい
		setTimeout(()=>{
			if(mode==="vertical"){
				inb2=el.classList.contains("verticalanime2");
				el.classList.add("verticalanime2");
			}else if(mode==="horizontal"){
				inb2=el.classList.contains("horizontalanime2");
				el.classList.add("horizontalanime2");
			}else if(mode==="fade"){
				inb2=el.classList.contains("fadeanime2");
				el.classList.add("fadeanime2");
			}
			setTimeout(()=>{
				//戻す（アニメーション）
				if(mode==="vertical"){
					if(appear){
						el.style.height=h+"px";
					}else{
						el.style.height="0";
					}
				}else if(mode==="horizontal"){
					if(appear){
						el.style.width=h+"px";
					}else{
						el.style.width="0";
					}
				}else if(mode==="fade"){
					if(appear){
						el.style.opacity="1";
					}else{
						el.style.opacity="0";
					}
				}
				var listener;
				el.addEventListener("transitionend",listener=(e:TransitionEvent)=>{
					if(!inb1){
						if(mode==="vertical"){
							el.classList.remove("verticalanime1");
						}else if(mode==="horizontal"){
							el.classList.remove("horizontalanime1");
						}else if(mode==="fade"){
							el.classList.remove("fadeanime1");
						}
					}
					if(!inb2){
						if(mode==="vertical"){
							el.classList.remove("verticalanime2");
						}else if(mode==="horizontal"){
							el.classList.remove("horizontalanime2");
						}else if(mode==="fade"){
							el.classList.remove("fadeanime2");
						}
					}
					if(finish){
						if(mode==="vertical"){
							el.style.removeProperty("height");
						}else if(mode==="horizontal"){
							el.style.removeProperty("width");
						}else if(mode==="fade"){
							el.style.removeProperty("opacity");
						}
						if(!appear){
							if(el.parentNode){
								el.parentNode.removeChild(el);
							}
						}
					}
					callback();
					el.removeEventListener("transitionend",listener,false);
				},false);
			},0);
		},0);
	}
	//要素作る
	export function makeEl<T extends HTMLElement>(name:string,callback:(el:T)=>void){
		var el=<T>document.createElement(name);
		callback(el);
		return el;
	}
	export function createChannelDatasetString(channel:string):string{
		return channel.replace(/\//g,"-");
	}
}
