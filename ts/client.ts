module Chat{
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
        init():void{
            //周辺機器を初期化
            this.userData=this.makeUserData();
            this.connection=this.makeConnection(this.userData);
            this.receiver=this.makeReceiver(this.connection);
            this.process=this.makeProcess(this.connection,this.receiver,this.userData);
            this.view=this.makeView();
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
            var c:ChatConnection = this.createConnection();
            //What setting?
            c.initConnection({});
            //channel?
            c.register(userData.getLastid(),null);
            return c;
        }
        //ログレシーバを作る
        makeReceiver(connection:ChatConnection):ChatReceiver{
            var r:ChatReceiver=new ChatReceiver(connection);
            r.init();
            return r;
        }
        //チャットプロセスを作る
        makeProcess(connection:ChatConnection,receiver:ChatReceiver,userData:ChatUserData):ChatProcess{
            return new ChatProcess(connection,receiver,userData);
        }
        //ビューを作る
        makeView():ChatView{
            var v:ChatView=new ChatView;
            v.init(this.connection,this.receiver);
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
