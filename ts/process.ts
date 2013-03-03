module Chat{
    /// <reference path="connection.ts"/>
    //ログオブジェクト
    export interface LogObj {
        _id:string; //発言のid
        name:string;    //発言者名
        time:string;    //ISODate
        ip:string;
        channel:any;    //文字列か配列
        comment:string; //コメント（文字列化された）
        syslog?:bool;
        commentObject?:any; //文字列表現でないコメントがある場合
        ipff?:string;   //Forwarded forの場合のもとIP
    }
    //ユーザーオブジェクト
    export interface UserObj {
        id:number;  //Id
        name:string;
        ip:string;
        rom:bool;
        ua:string;
    }
    //ユーザーの情報を保存するぞ!
    export class ChatUserData{
        //lastid: 最後のsessionid
        private lastid:string;
        setLastid(id:string):void{
            this.lastid=id;
            this.save();
        }
        getLastid():string{
            return this.lastid;
        }
        //読み込み
        load():void{
            this.lastid = localStorage.getItem("lastid") || null;
        }
        //保存
        save():void{
            localStorage.setItem("lastid",this.lastid);
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
        inout(data:{rom:bool;id:string;name:string;}):void{
            this.event.emit("inout",data);
        }
    }
    //チャットの動作管理をするぞ！
    export class ChatProcess{
        //コネクション
        constructor(private connection:ChatConnection,private receiver:ChatReceiver,private userData:ChatUserData){
        }
        //自分を初期化
        init():void{
        }
    }
}
