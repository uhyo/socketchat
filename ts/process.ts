module Chat{
    /// <reference path="definition.ts"/>
    /// <reference path="connection.ts"/>
    //-----------------
    //ユーザーの情報を保存するぞ!
    export class ChatUserData{
        //lastid: 最後のsessionid
        public lastid:string;
        public name:string;    //ユーザー名
        public gyoza:number;    //Gyazo設定(0～2)
        public volume:number;   //ボリューム(0～100)
        public channelMode:number;  //チャネル開き方設定(0～1)
        public dischannel:string[]; //dischannel対象一覧
        //読み込み
        load():void{
            this.lastid = localStorage.getItem("lastid") || null;
            this.name = localStorage.getItem("socketchat_name") || null;
            this.gyoza= Number(localStorage.getItem("gyoza")) || 0;
            this.volume=Number(localStorage.getItem("volume"))|| 50;
            this.channelMode= Number(localStorage.getItem("channelMode")) || 0;
            //dischannel
            var disc=localStorage.getItem("dischannel");
            this.dischannel = disc ? JSON.parse(disc) : [];
        }
        //保存
        save():void{
            if("string"===typeof this.lastid)localStorage.setItem("lastid",this.lastid);
            if("string"===typeof this.name)localStorage.setItem("socketchat_name",this.name);
            localStorage.setItem("gyoza",String(this.gyoza));
            localStorage.setItem("volume",String(this.volume));
            localStorage.setItem("channelMode",String(this.channelMode));
            localStorage.setItem("dischannel",JSON.stringify(this.dischannel));
        }

    }
    // サーバーから情報を受け取るぞ!
    export class ChatReceiver{
        private oldest_time:Date=null;    // 保有している最も古いログ
        private event:EventEmitter; //内部使用
        constructor(private connection:ChatConnection){
            this.event=getEventEmitter();
        }
        //イベント操作用
        on(event:string,listener:(...args:any[])=>any):void{
            this.event.on(event,listener);
        }
        once(event:string,listener:(...args:any[])=>any):void{
            this.event.once(event,listener);
        }
        removeListener(event:string,listener:(...args:any[])=>any){
            this.event.removeListener(event,listener);
        }
        removeAllListeners(event?:string){
            this.event.removeAllListeners(event);
        }

        //通信初期化
        init():void{
            // ログ初期化
            var c:ChatConnection=this.connection;
            c.on("init",this.loginit.bind(this));
            c.on("log",this.log.bind(this));
            c.on("users",this.userinit.bind(this));
            c.on("userinfo",this.userinfo.bind(this));
            c.on("newuser",this.newuser.bind(this));
            c.on("deluser",this.deluser.bind(this));
            c.on("inout",this.inout.bind(this));
        }
        //最初のログを送ってきた
        loginit(data:{logs:LogObj[];}):void{
            //一番古いログをとる
            if(data.logs){
                this.oldest_time=new Date(data.logs[data.logs.length-1].time);
            }
            this.event.emit("loginit",data.logs);
        }
        //ログを送ってきた
        log(data:LogObj):void{
            this.event.emit("log",data);
        }
        //ユーザー一覧だ
        userinit(data:{users:UserObj[];roms:number;active:number;}):void{
            this.event.emit("userinit",data);
        }
        //自分の情報を教えてもらう
        userinfo(data:{name:string;rom:bool;}):void{
            this.event.emit("userinfo",data);
        }
        //誰かきた
        newuser(data:UserObj):void{
            this.event.emit("newuser",data);
        }
        //いなくなった
        deluser(userid:string):void{
            this.event.emit("deluser",userid);
        }
        //入退室した
        inout(data:UserObj):void{
            this.event.emit("inout",data);
        }
    }
    //チャットの動作管理をするぞ！
    export class ChatProcess{
        //コネクション
        constructor(private connection:ChatConnection,private receiver:ChatReceiver,private userData:ChatUserData){
        }
        //入退室する
        inout(data:InoutNotify){
            //サーバーに送る
            this.connection.send("inout",data);
        }
        //コメントする
        comment(data:CommentNotify){
            //チャネル処理とか入れたいけど・・・？
            this.connection.send("say",data);
        }
        //チャネルウィンドウを開く
        openChannel(channelname:string){
            sessionStorage.setItem("independent_flag","true");  //子ウィンドウに大して子であると伝える
            var win=window.open(location.pathname+"#"+channelname);
            //まず通信を確立する
            var wait=100, count=0;
            var timerid=null;
            var listener:(e:MessageEvent)=>void;
            window.addEventListener("message",listener=(e:MessageEvent)=>{
                var d=e.data;
                if(d.name==="pong"){
                    //データが帰ってきた！通信準備
                    clearTimeout(timerid);
                    window.removeEventListener("message",listener);
                    //情報を送る
                    var channel=new MessageChannel();
                    channel.port1.start();
                    var ls:(e:MessageEvent)=>void;
                    channel.port1.addEventListener("message",ls=(e:MessageEvent)=>{
                        var d=e.data;
                        if(d.name==="ready"){
                            //通信準備ができた
                            channel.port1.removeEventListener("message",ls);
                            //子として登録
                            var hub=this.connection.getHub();
                            var child=hub.makeChild(channel.port1);
                            hub.addChild(child);
                            hub.initChild(child,channelname);
                            delete sessionStorage.removeItem("independent_flag");
                        }
                    });
                    //初期化してあげる
                    win.postMessage({
                        name:"init",
                    },"*",[channel.port2]);
                }
            });
            ping();
            function ping():void{
                //送る（反応あったら受付開始したとわかる）
                win.postMessage({
                    name:"ping",
                },"*");
                //次のpingを用意
                timerid=setTimeout(ping,wait);
            }
        }
    }
}
