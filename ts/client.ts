module Chat{
    /// <rederence path="definition.ts"/>
    /// <reference path="connection.ts"/>
    /// <reference path="process.ts"/>
    /// <reference path="view.ts"/>

    //枠的な?
    export class ChatClient{
        private userData:ChatUserData;
        private connection:ChatConnection;
        private receiver:ChatReceiver;
        private process:ChatProcess;
        private view:ChatView;
        //自分のチャネル
        private channel:string;
        //自分が子どもかどうか
        private child:bool;
        init(channel:string,child:bool):void{
            this.channel=channel, this.child=child;
            //周辺機器を初期化
            this.userData=this.makeUserData();
            this.connection=this.makeConnection(this.userData);
            this.connection.onConnection(()=>{
                this.receiver=this.makeReceiver(this.connection);
                this.process=this.makeProcess(this.connection,this.receiver,this.userData);
                this.view=this.makeView();
            });
        }
        //ユーザーデータを・・・?
        makeUserData():ChatUserData{
            var d:ChatUserData=new ChatUserData;
            d.load();
            return d;
        }
        //コネクションを作る
        createConnection():ChatConnection{
            return new ChatConnection;
        }
        makeConnection(userData:ChatUserData):ChatConnection{
            var c:ChatConnection;
            if(this.child){
                c=new ChildConnection;
            }else{
                c= this.createConnection();
            }
            //What setting?
            c.initConnection({});
            c.register(userData.lastid,this.channel);
            return c;
        }
        //ログレシーバを作る
        makeReceiver(connection:ChatConnection):ChatReceiver{
            var r:ChatReceiver=new ChatReceiver(connection,this.channel);
            r.init();
            return r;
        }
        //チャットプロセスを作る
        makeProcess(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData):ChatProcess{
            return new ChatProcess(connection,receiver,userData,this.channel);
        }
        //ビューを作る
        makeView():ChatView{
            var v:ChatView=new ChatView;
            v.init(this.userData,this.connection,this.receiver,this.process);
            return v;
        }
    }
    //Socket.IO使用
    export class SocketChatClient extends ChatClient{
        private process:ChatProcess;
        createConnection():SocketConnection{
            return new SocketConnection;
        }
    }
}
