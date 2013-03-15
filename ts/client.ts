declare var settings:any;   //settingsが/settings.jsによって与えられる
module Chat{
    /// <reference path="definition.ts"/>
    /// <reference path="connection.ts"/>
    /// <reference path="process.ts"/>
    /// <reference path="view.ts"/>

    //枠的な?
    export class ChatClient{
        constructor(private userData:ChatUserData,private connection:ChatConnection,private receiver:ChatReceiver,private process:ChatProcess,private view:ChatView,private channel:string){
        }
    }
    //Factory
    export class ChatClientFactory{
        private child:bool;
        constructor(private channel:string,private com:bool,private connection:string){
            //子かどうかの判定入れる
            this.child= !!sessionStorage.getItem("independent_flag");
        }
        getChat(callback:(c:ChatClient)=>void):void{
            //userData取得
            var userData:ChatUserData=this.makeUserData();
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
                //作る
                var chat=new ChatClient(userData,connection,receiver,process,view,this.channel);
                if(callback){
                    callback(chat);
                }
            });
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
                connection=new ChatConnection;  //実体ないよ！
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
    }
}
