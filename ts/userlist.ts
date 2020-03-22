/// <reference path="client.ts"/>
// dirty ambient declaration
declare var twemoji: { parse: Function } | undefined;
module Chat{
	//userList
	export class UserListFactory extends ChatClientFactory{
		constructor(){
			super(null,false,null);
		}
		makeConnection(userData:ChatUserData):ChatConnection{
			var connection:ChatConnection=new SocketConnection;
			connection.initConnection(settings);
			connection.register(null,null,"userlist");
			return connection;
		}
		makeReceiver(connection:ChatConnection):ChatReceiver{
			return new ChatReceiver(connection,null);
		}
		makeView(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData,process:ChatProcess):UserListView{
			return new UserListView(userData,connection,receiver);
		}
		makeAPI(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData,process:ChatProcess,view:ChatView):ChatClientAPI{
			return null;
		}
	}
	export class UserList{
		constructor(private userData:ChatUserData,private connection:ChatConnection,private receiver:ChatReceiver,private view:UserListView){
		}
	}
	//ビュー
	export class UserListView extends ChatView{
		//private container:HTMLElement;
		private table:HTMLTableElement;
		//private userData:ChatUserData;
		//private connection:ChatConnection;
		//private receiver:ChatReceiver;
		constructor(userData:ChatUserData,connection:ChatConnection,receiver:ChatReceiver){
			super(userData,connection,receiver,null,false,null);
		}
		initView(userData:ChatUserData,connection:ChatConnection,receiver:ChatReceiver,process:ChatProcess,com:boolean):void{
			this.container=document.createElement("div");
			//bodyへ
			document.body.appendChild(this.container);
			this.container.appendChild(((h1)=>{
				h1.textContent="UserList";
				return h1;
			})(document.createElement("h1")));
			//テーブル
			this.table=<HTMLTableElement>document.createElement("table");
			this.initTable(this.table);
			this.container.appendChild(this.table);
			//ユーザー情報を監視
			receiver.on("userinit",this.userinit.bind(this));
			receiver.on("newuser",this.newuser.bind(this));
			receiver.on("deluser",this.deluser.bind(this));
			receiver.on("inout",this.inout.bind(this));
		}
		initTable(table:HTMLTableElement):void{
			//thead
			var thead=table.createTHead();
			["名前","IPアドレス","UA"].forEach((x:string)=>{
				var th=document.createElement("th");
				th.textContent=x;
				thead.appendChild(th);
			});
		}
		userinit(data:{users:UserObj[];roms:number;active:number;}):void{
			data.users.forEach(this.newuser,this);
		}
		newuser(user:UserObj):void{
			//行追加
			var tr=<HTMLTableRowElement>this.table.insertRow(-1);
			tr.style.color=this.getColorByIP(user.ip);
			tr.dataset.id=String(user.id);
			["(ROM)",user.ip,user.ua].forEach((x:string)=>{
				var td=tr.insertCell(-1);
				td.textContent=x;
			});
			if(!user.rom){
				//入室中だ
				this.inout(user);
			}
		}
		//誰かがお亡くなりに
		deluser(userid:number):void{
			var tr=this.getElement(userid);
			if(tr){
				this.table.deleteRow(tr.rowIndex);
			}
		}
		//誰かが入退室した
		inout(user:UserObj):void{
			var tr=this.getElement(user.id);
			if(tr){
				var td=<HTMLTableDataCellElement>tr.cells[0];
				if(user.rom){
					td.textContent="(ROM)";
				}else{
					td.textContent=user.name;
				}
				// emojify unicode to image (only if twemoji is declared in global)
				if(typeof twemoji!=="undefined") twemoji.parse(td);
			}
		}
		//問題の行
		getElement(userid:number):HTMLTableRowElement{
			var rows=this.table.rows;
			for(var i=0,l=rows.length;i<l;i++){
				if((<HTMLElement>rows[i]).dataset.id===String(userid)){
					return <HTMLTableRowElement>rows[i];
				}
			}
			return null;
		}
		//遠いのでコピーしてきてしまった!(hard coding)
		// IPアドレスから色を決める
		getColorByIP(ip:string):string{
			var arr:string[]=ip.split(/\./);
			return "rgb("+Math.floor(parseInt(arr[0])*0.75)+","+
			Math.floor(parseInt(arr[1])*0.75)+","+
			Math.floor(parseInt(arr[2])*0.75)+")";
		}
	}
}
