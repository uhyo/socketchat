module Chat{
	/// <reference path="client.ts"/>
	export module ChatUICollection{
		export class SwitchViewForm extends UIObject{
			public event:EventEmitter;
			private container:HTMLFormElement;
			constructor(){
				super();
				this.container=<HTMLFormElement>document.createElement("form");
				//フォーム開閉ボタン
				var p=document.createElement("p");
				this.container.appendChild(p);
				p.appendChild(this.makeinput(input=>{
					input.type="button";
					input.value="設定";
					input.dataset.open="setting";
				}));
				p.appendChild(this.makeinput(input=>{
					input.type="button";
					input.value="入室者";
					input.dataset.open="userlist";
				}));
				p.appendChild(this.makeinput(input=>{
					input.type="button";
					input.value="その他";
					input.dataset.open="others";
				}));
				p.appendChild(this.makeinput(input=>{
					input.type="button";
					input.value="戻る";
					input.dataset.open="";
				}));
				this.container.addEventListener("click",(e:Event)=>{
					var t=<HTMLInputElement>e.target;
					if(/^input$/i.test(t.tagName)){
						var tar=t.dataset.open;
						this.open(tar);
					}
				},false);
			}
			open(w:string){
				//表示を切り替える
				var inputs=this.container.getElementsByTagName("input");
				for(var i=0,l=inputs.length;i<l;i++){
					var input=<HTMLInputElement>inputs.item(i);
					if(w==="" && input.dataset.open===""){
						//戻るボタンはいらない
						input.style.display="none";
					}else if(w!=="" && input.dataset.open!==""){
						//戻る以外はいらない
						input.style.display="none";
					}else{
						//表示
						input.style.removeProperty("display");
					}
				}
				this.event.emit("open",w);
			}
		}
	}
	export class ChatSmpView extends ChatView{
		private container;
		private linksView:ChatLinksView;
		private settingView:ChatSettingView;
		public logView:ChatLogView;
		private userView:ChatUserView;
		private ui:ChatUI;
		private motto:ChatUICollection.MottoForm;
		//--
		private switchView:ChatUICollection.SwitchViewForm;
		constructor(userData:ChatUserData,connection:ChatConnection,receiver:ChatReceiver,process:ChatProcess){
			super(userData,connection,receiver,process,false);
			//切り替えボタンをつくる
			this.switchView=new ChatUICollection.SwitchViewForm();
			this.container.insertBefore(this.switchView.getContainer(),this.container.firstChild);
			var ev=this.switchView.event;
			//イベントに対応する
			var elss:{[index:string]:HTMLElement[];}={
				"":[this.logView.getContainer(),this.ui.getContainer(),this.motto.getContainer()],
				"setting":[this.settingView.getContainer()],
				"userlist":[this.userView.getContainer()],
				"others":[this.linksView.getContainer()],
			};
			ev.on("open",(w:string)=>{
				for(var key in elss){
					var els=elss[key];
					els.forEach(el=>{
						if(key===w){
							//これを表示
							el.style.removeProperty("display");
						}else{
							//非表示
							el.style.display="none";
						}
					});
				}
			});
			//初期化
			this.switchView.open("");
		}
	}
	export class SmpClientFactory extends ChatClientFactory{
		constructor(private channel:string,private connection:string){
			super(channel,false,connection);
		}
		makeView(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData,process:ChatProcess){
			return new ChatSmpView(userData,connection,receiver,process);
		}
	}
}
