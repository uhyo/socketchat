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
        public disip:string[];
        public dischannel:string[]; //dischannel対象一覧
        public autoin:bool;     //自動入室有効かどうか
        //コマンドライン系
        public cmd:{
            height:string;  //コマンドライン高さ
            syschar:string;
        };
        //読み込み
        load():void{
            this.lastid = localStorage.getItem("lastid") || null;
            this.name = localStorage.getItem("socketchat_name") || null;
            this.gyoza= Number(localStorage.getItem("gyoza")) || 0;
            this.volume=Number(localStorage.getItem("volume"));
            if(isNaN(this.volume))this.volume=50;
            this.channelMode= Number(localStorage.getItem("channelMode")) || 0;
            //dischannel
            var disi=localStorage.getItem("disip");
            this.disip = disi ? JSON.parse(disi) : [];
            var disc=localStorage.getItem("dischannel");
            this.dischannel = disc ? JSON.parse(disc) : [];
            var cmd=localStorage.getItem("cmd");
            this.cmd= cmd ? JSON.parse(cmd) : {
                height:"30em", syschar:"\\",
            };
            //autoin
            this.autoin = !!localStorage.getItem("socketchat_autoin");
        }
        //保存
        save():void{
            if("string"===typeof this.lastid)localStorage.setItem("lastid",this.lastid);
            if("string"===typeof this.name)localStorage.setItem("socketchat_name",this.name);
            localStorage.setItem("gyoza",String(this.gyoza));
            localStorage.setItem("volume",String(this.volume));
            localStorage.setItem("channelMode",String(this.channelMode));
            localStorage.setItem("disip",JSON.stringify(this.disip));
            localStorage.setItem("dischannel",JSON.stringify(this.dischannel));
            localStorage.setItem("cmd",JSON.stringify(this.cmd));
            if(this.autoin){
                localStorage.setItem("socketchat_autoin","true");
            }else{
                localStorage.removeItem("socketchat_autoin");
            }
        }

    }
    //チャットの動作管理をするぞ！
    export class ChatProcess{
        //コネクション
        constructor(private connection:ChatConnection,private receiver:ChatReceiver,private userData:ChatUserData,private channel:string){
            if(userData.autoin && userData.name){
                receiver.ready(()=>{
                    this.inout({
                        name:userData.name,
                    },"in");
                });
            }
        }
        //入退室する
        inout(data:InoutNotify,operation?:string):bool{
            if(operation){
                //operationがあるとき:一方通行
                var userinfo=this.receiver.getUserinfo();
                console.log(userinfo);
                if(operation==="in"){
                    if(userinfo.rom!==true){
                        return false;
                    }
                }else if(operation==="out"){
                    if(userinfo.rom===true){
                        return false;
                    }
                }
            }
            //サーバーに送る
            this.connection.send("inout",data);
            //名前保存
            if(data.name){
                this.userData.name=data.name;
                this.userData.save();
            }
            return true;
        }
        //コメントする
        comment(data:CommentNotify):void{
            //チャネル処理とか入れたいけど・・・？
            //チャネル追加
            if(this.channel){
                var ch = data.channel ? data.channel : [];
                if(ch.indexOf(this.channel)<0){
                    //まだない
                    ch.push(this.channel);
                    data.channel=ch;
                }
            }
            this.connection.send("say",data);
        }
        //motto!(丸投げ)
        motto(data:MottoNotify):void{
            this.receiver.motto(data);
        }
        //チャネルウィンドウを開く
        openChannel(channelname:string,closecallback?:()=>void){
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
                            var hub=this.receiver.getHub();
                            var child=hub.makeChild(channel.port1,closecallback);
                            hub.addChild(child);
                            hub.initChild(child,channelname);
                            //ここからかこう!
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
