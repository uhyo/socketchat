declare var settings:any;	//settingsが/settings.jsによって与えられる
module Chat{
	/// <reference path="definition.ts"/>
	/// <reference path="connection.ts"/>
	/// <reference path="process.ts"/>
	/// <reference path="view.ts"/>

	//枠的な?
	export class ChatClient{
		constructor(private userData:ChatUserData,private connection:ChatConnection,private receiver:ChatReceiver,private process:ChatProcess,private view:ChatView,public api:ChatClientAPI,private channel:string){
		}
	}
	//Factory
	export class ChatClientFactory{
		private child:bool;
		private chat:ChatClient;
		private domReady:bool=false;
		constructor(private channel:string,private com:bool,private connection:string){
			//子かどうかの判定入れる
			this.child= !!sessionStorage.getItem("independent_flag");
			//ready?
			document.addEventListener("DOMContentLoaded",(e:Event)=>{
				this.domReady=true;
			},false);
		}
		getChat(callback?:(c:ChatClient)=>void):void{
			if(this.chat){
				//既にチャットを作ったならそれをあげる
				if(callback){
					callback(this.chat);
				}
				return;
			}
			//userData取得
			var userData:ChatUserData=this.makeUserData();
			var listener=(e:Event)=>{
				//connection作る
				var connection:ChatConnection=this.makeConnection(userData);
				connection.onConnection((sessionid:string)=>{
					//reg
					if(sessionid){
						userData.lastid=sessionid;
						userData.save();
					}
					//receiver
					var receiver:ChatReceiver=this.makeReceiver(connection);
					//process作る
					var process:ChatProcess=this.makeProcess(connection,receiver,userData);
					//view
					var view:ChatView=this.makeView(connection,receiver,userData,process);
					//api
					var api:ChatClientAPI=this.makeAPI(connection,receiver,userData,process,view);
					//作る
					var chat=new ChatClient(userData,connection,receiver,process,view,api,this.channel);
					this.chat=chat;
					if(callback){
						callback(chat);
					}
				});
			};
			if(this.domReady){
				listener(null);
			}else{
				document.addEventListener("DOMContentLoaded",listener,false);
			}
		}
		makeUserData():ChatUserData{
			var ud=new ChatUserData;
			ud.load();
			return ud;
		}
		makeConnection(userData:ChatUserData):ChatConnection{
			var connection:ChatConnection;
			if(this.child){
				connection=new ChildConnection;
			}else if(this.connection==="socket"){
				connection=new SocketConnection;
			}else{
				connection=new ChatConnection;	//実体ないよ！
			}
			connection.initConnection(settings);
			connection.register(userData.lastid,this.channel);
			return connection;
		}
		makeReceiver(connection:ChatConnection):ChatReceiver{
			return new ChatReceiver(connection,this.channel);
		}
		makeProcess(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData):ChatProcess{
			return new ChatProcess(connection,receiver,userData,this.channel);
		}
		makeView(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData,process:ChatProcess):ChatView{
			return new ChatView(userData,connection,receiver,process,this.com);
		}
		makeAPI(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData,process:ChatProcess,view:ChatView):ChatClientAPI{
			return new ChatClientAPI(userData,connection,receiver,process,view);
		}
	}
	//API
	export class ChatClientAPI{
		private acceptedEvents:string[]=["log","userinfo","newuser","deluser","init"];
		constructor(private userData:ChatUserData,private connection:ChatConnection,private receiver:ChatReceiver,private process:ChatProcess,private view:ChatView){
		}
		//イベント操作用
		on(event:string,listener:(...args:any[])=>any):void{
			if(this.acceptedEvents.indexOf(event)===-1)return;
			this.receiver.on(event,listener);
		}
		once(event:string,listener:(...args:any[])=>any):void{
			if(this.acceptedEvents.indexOf(event)===-1)return;
			this.receiver.once(event,listener);
		}
		removeListener(event:string,listener:(...args:any[])=>any){
			if(this.acceptedEvents.indexOf(event)===-1)return;
			this.receiver.removeListener(event,listener);
		}
		//入退室
		inout(name:string):void{
			var data:InoutNotify={
				name:name,
			};
			this.process.inout(data);
		}
		//発言
		say(comment:string,response:string,channel:any):void{
			if(!channel)channel=null;
			else if("string"===typeof channel){
				channel=[channel];
			}else if(!Array.isArray(channel)){
				throw null;
			}
			var data:CommentNotify={
				comment:comment,
				response:response,
				channel:channel,
			};
			this.process.comment(data);
		}
	}
}
