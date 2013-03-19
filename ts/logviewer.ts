module Chat{
	/// <reference path="client.ts"/>
	//userList
	export class LogViewerFactory{
		constructor(){
		}
		getLogViewer(callback:(u:LogViewer)=>void){
			var userData=this.makeUserData();
			var connection=this.makeConnection(userData);
			var receiver=this.makeReceiver(connection);
			var view=this.makeView(connection,receiver,userData);
			if(callback){
				callback(new LogViewer(userData,connection,receiver,view));
			}
		}
		makeUserData():ChatUserData{
			var ud=new ChatUserData;
			ud.load();
			return ud;
		}
		makeConnection(userData:ChatUserData):ChatConnection{
			var connection:ChatConnection=new SocketConnection;
			connection.initConnection(settings);
			connection.register(null,null,"chalog");
			return connection;
		}
		makeReceiver(connection:ChatConnection):FindReceiver{
			return new FindReceiver(connection);
		}
		makeView(connection:ChatConnection,receiver:FindReceiver,userData:ChatUserData):LogViewerView{
			return new LogViewerView(userData,connection,receiver);
		}
	}
	export class LogViewer{
		constructor(private userData:ChatUserData,private connection:ChatConnection,private receiver:ChatReceiver,private view:LogViewerView){
		}
	}
	//ビュー
	export class LogViewerView{
		private container:HTMLElement;
		private qf:FindQueryForm;
		private logFlow:ChatLogFlow;
		constructor(private userData:ChatUserData,private connection:ChatConnection,private receiver:FindReceiver){
			this.container=document.createElement("div");
			//bodyへ
			document.body.appendChild(this.container);
			this.container.appendChild((h1)=>{
				h1.textContent="Chalog Viewer";
				return h1;
			}(document.createElement("h1")));
			//
			this.qf=new FindQueryForm();
			this.container.appendChild(this.qf.getContainer());
			//クエリが発行されたら・・・?
			this.qf.onQuery((query:FindQuery)=>{
				this.connection.send("query",query);
			});
			//ログ表示部分
			this.logFlow=new ChatLogFlow(userData,receiver);
			this.container.appendChild(this.logFlow.getContainer());
			this.logFlow.refreshSettings();
			//チャネルをクリックしたら?
			this.logFlow.event.on("focusChannel",(channel:string)=>{
				//チャットを開く
				var a=<HTMLAnchorElement>document.createElement("a");
				a.href="/#"+channel;
				a.target="_blank";
				a.click();
			});
		}
	}
	//検索条件フォーム
	export class FindQueryForm extends ChatUICollection.UIObject{
		private event:EventEmitter;
		private container:HTMLFormElement;
		private query:FindQuery=null;	//現在のクエリ
		constructor(){
			super();
			this.container=<HTMLFormElement>document.createElement("form");
			this.container.appendChild(this.makeRangePart());
			this.container.appendChild(this.makeQueryPart());
			this.container.appendChild(this.makeOperatePart());
			this.container.addEventListener("submit",(e:Event)=>{
				var form=<HTMLFormElement>e.target;
				e.preventDefault();
				//クエリつくる
				var query:FindQuery={};
				query.value=Number(formValue("page_number"));
				query.page=0;
				var range=getRadioValue(form,"range");
				if(range==="time"){
					//時間
					var of=(new Date).getTimezoneOffset()*60000;	//ミリ秒
					query.starttime=new Date((new Date(formValue("starttime"))).getTime()+of);
					query.endtime=new Date((new Date(formValue("endtime"))).getTime()+of);
				}
				if(formChecked("use_name_or_ip")){
					var noi=getRadioValue(form,"name_or_ip");
					if(noi==="name"){
						//名前
						query.name=formValue("name_or_ip_value");
					}else if(noi==="ip"){
						query.ip=formValue("name_or_ip_value");
					}
				}
				if(formChecked("use_comment")){
					query.comment=formValue("comment_value");
				}
				if(formChecked("use_channel")){
					query.channel=formValue("channel_value");
				}
				//現在のクエリとして保存
				this.query=query;
				//クエリ発行
				this.event.emit("query",query);

				function formValue(name:string):string{
					return (<HTMLInputElement>form.elements[name]).value;
				}
				function formChecked(name:string):bool{
					return (<HTMLInputElement>form.elements[name]).checked;
				}
			},false);
		}
		//ページ移動してクエリ発行
		movePage(inc:number):void{
			if(!this.query)return;
			if(!this.query.page)this.query.page=0;
			this.query.page+=inc;
			if(this.query.page<0)this.query.page=0;
			this.event.emit("query",this.query);
		}
		onQuery(callback:(query:FindQuery)=>void):void{
			this.event.on("query",callback);
		}
		makeRangePart():HTMLFieldSetElement{
			var fs=<HTMLFieldSetElement>document.createElement("fieldset");
			fs.appendChild(makeEl("legend",(el)=>{
				el.textContent="取得範囲";
			}));
			fs.appendChild(makeEl("p",(p)=>{
				p.appendChild(makeEl("label",(label)=>{
					label.appendChild(makeEl("input",(el)=>{
						var input=<HTMLInputElement>el;
						input.type="radio";
						input.name="range";
						input.value="time";
					}));
					label.appendChild(document.createTextNode("発言時間で検索:"));
				}));
				var now=(new Date).toISOString();
				now=now.replace(/(?:Z|[-+]\d\d(?::?\d\d)?)$/,"");
				//ミリ秒は取り除く
				if(/^.+?T\d\d:\d\d:\d\d[\.,]\d+$/.test(now)){
					now=now.replace(/[\.,]\d+$/,"");
				}
				p.appendChild(makeEl("label",(label)=>{
					label.textContent="始点時間";
					label.appendChild(makeEl("input",(el)=>{
						var input=<HTMLInputElement>el;
						input.type="datetime-local";
						input.name="starttime";
						input.value=now;
						input.step="1";
					}));
				}));
				p.appendChild(makeEl("label",(label)=>{
					label.textContent=" 終点時間";
					label.appendChild(makeEl("input",(el)=>{
						var input=<HTMLInputElement>el;
						input.type="datetime-local";
						input.name="endtime";
						input.value=now;
						input.step="1";
					}));
				}));
			}));
			fs.appendChild(makeEl("p",(p)=>{
				p.appendChild(makeEl("label",(label)=>{
					label.appendChild(makeEl("input",(el)=>{
						var input=<HTMLInputElement>el;
						input.type="radio";
						input.name="range";
						input.value="new";
						input.checked=true;
					}));
					label.appendChild(document.createTextNode("新しいほうから検索"));
				}));
			}));
			return fs;
		}
		makeQueryPart():HTMLFieldSetElement{
			return <HTMLFieldSetElement>makeEl("fieldset",(fs)=>{
				fs.appendChild(makeEl("legend",(legend)=>{
					legend.textContent="検索条件";
				}));
				fs.appendChild(makeEl("p",(p)=>{
					p.appendChild(makeInput((input)=>{
						input.type="checkbox";
						input.name="use_name_or_ip";
					}));
					p.appendChild(makeInputAndLabel("名前",true,(input)=>{
						input.type="radio";
						input.name="name_or_ip";
						input.value="name";
						input.checked=true;
					}));
					p.appendChild(document.createTextNode("or"));
					p.appendChild(makeInputAndLabel("IPアドレス",true,(input)=>{
						input.type="radio";
						input.name="name_or_ip";
						input.value="ip";
					}));
					p.appendChild(document.createTextNode("で検索:"));
					p.appendChild(makeInput((input)=>{
						input.type="text";
						input.name="name_or_ip_value";
						input.size=25;
					}));

				}));
				fs.appendChild(makeEl("p",(p)=>{
					p.appendChild(makeInputAndLabel("コメントで検索:",true,(input)=>{
						input.type="checkbox";
						input.name="use_comment";
					}));
					p.appendChild(makeInput((input)=>{
						input.type="text";
						input.name="comment_value";
						input.size=60;
					}));
				}));
				fs.appendChild(makeEl("p",(p)=>{
					p.appendChild(makeInputAndLabel("ハッシュタグで検索:",true,(input)=>{
						input.type="checkbox";
						input.name="use_channel";
					}));
					p.appendChild(makeInputAndLabel("#",false,(input)=>{
						input.type="text";
						input.name="channel_value";
						input.size=25;
					}));
				}));
				//変更されたらチェックボックスを入れたりする処理
				fs.addEventListener("change",(e:Event)=>{
					//先取りinput
					var inp=<HTMLInputElement>e.target;
					if(!/^input$/i.test(inp.tagName))return;	//違う
					if(inp.type==="checkbox")return;	//チェックボックス自身は気にしない
					//チェックボックスを探す
					var checkbox=<HTMLInputElement>(<XPathEvaluator>document).evaluate('ancestor-or-self::p/descendant::input[@type="checkbox"]',inp,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null).singleNodeValue;
					if(checkbox){
						checkbox.checked= inp.value!=="";
					}
				},false);
			});
		}
		makeOperatePart():HTMLFieldSetElement{
			return <HTMLFieldSetElement>makeEl("fieldset",(fs)=>{
				fs.appendChild(makeEl("legend",(legend)=>{
					legend.textContent="検索";
				}));
				fs.appendChild(makeEl("p",(p)=>{
					p.appendChild(makeInput((input)=>{
						input.type="submit";
						input.value="検索";
					}));
					p.appendChild(document.createTextNode(": 1ページに"));
					p.appendChild(makeInput((input)=>{
						input.type="number";
						input.min="100";
						input.max="500";
						input.step="100";
						input.name="page_number";
						input.value="100";
					}));
					p.appendChild(document.createTextNode("発言表示"));
				}));
				fs.appendChild(makeEl("p",(p)=>{
					p.appendChild(makeInput((input)=>{
						input.type="button";
						input.value="前のページ";
						input.addEventListener("click",(e:Event)=>{
							this.movePage(-1);
						},false);
					}));
					p.appendChild(makeEl("output",(el)=>{
						var output=<HTMLOutputElement>el;
						output.name="thispage";
						output.value="";
						//イベント
						this.event.on("query",(q:FindQuery)=>{
							output.value=q.page+"ページ目";
						});
					}));
					p.appendChild(makeInput((input)=>{
						input.type="button";
						input.value="次のページ";
						input.addEventListener("click",(e:Event)=>{
							this.movePage(1);
						},false);
					}));
				}));
			});
		}
	}
	//拡張Receiver（resultをうけとれる）
	export class FindReceiver extends ChatReceiver{
		private event:EventEmitter;
		constructor(private connection:ChatConnection){
			super(connection,null);
			//追加
			connection.on("result",this.result.bind(this));
		}
		result(data:{logs:LogObj[];}):void{
			//ログを初期化する感じで!
			this.event.emit("loginit",data.logs);
		}
	}
	//検索クエリ
	export interface FindQuery{
		value?:number;	 //1ページのログ数
		page?:number;
		starttime?:Date;
		endtime?:Date;
		name?:string;
		ip?:string;
		comment?:string;
		channel?:string;
	}
	function makeInput(callback:(el:HTMLInputElement)=>void){
		return makeEl("input",(el)=>callback(<HTMLInputElement>el));
	}
	function makeInputAndLabel(text:string,follow:bool,callback:(el:HTMLInputElement)=>void){
		return makeEl("label",(label)=>{
			if(follow){
				label.appendChild(makeInput(callback));
				label.appendChild(document.createTextNode(text));
			}else{
				label.appendChild(document.createTextNode(text));
				label.appendChild(makeInput(callback));
			}
		});
	}
	function getRadioValue(form:HTMLFormElement,name:string):string{
		var t=<any>form.elements[name];
		if(t&&t.length&&t.item){
			for(var i=0,l=t.length;i<l;i++){
				if(t[i].checked)return t[i].value;
			}
		}else if(t){
			return t.checked ? t.value :null;
		}
		return null;
	}
}
