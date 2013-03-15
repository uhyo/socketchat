declare var io:any;
module Chat{
    /// <reference path="definition.ts"/>
    export interface EventEmitter{
        addListener:(event:string,listener:(...args:any[])=>any)=>void;
        on:(event:string,listener:(...args:any[])=>any)=>void;
        once:(event:string,listener:(...args:any[])=>any)=>void;
        removeListener:(event:string,listener:(...args:any[])=>any)=>void;
        removeAllListeners:(event?:string)=>void;
        listeners:(event:string)=>any;
        emit:(event:string,...args:any[])=>void;
    }
    
    //EventEmitter constructor
    export function getEventEmitter():EventEmitter{
        return new io.EventEmitter;
    }
    export class ChatConnection{
        //内部用
        private event:EventEmitter;
        //ソケット
        private connection: EventEmitter;
        constructor(){
            this.event=getEventEmitter();
        }
        
        //コネクション初期化メソッド
        initConnection(settings:any):void{
            //ダミーだけど・・・
            this.connection=getEventEmitter();
        }
        //サーバーに登録
        register(lastid:string,channel:string):void{
            //lastid: 前回のセッションID（自動復帰可能）, channel:チャネル
        }
        //コネクション確立したら
        onConnection(func:(...args:any[])=>any):void{
            this.event.on("connect",func);
        }
        //サーバーからログ探す
        findLog(query:FindNotify,callback:(logs:LogObj[])=>void):void{
            this.send("find",query,(arr:LogObj[])=>{
                if(!Array.isArray(arr)){
                    callback([]);
                }else{
                    callback(arr);
                }
            });
        }
        //ユーザー一覧をサーバーから取得する
        getUsers(callback:(users:UserObj[])=>void):void{
            this.send("users",(arr:UserObj[])=>{
                callback(arr);
            });
        }
        //サーバーへコマンド発行（socket.ioのemit）
        send(event:string,...args:any[]):void{
        }
        //--connection操作
        emit(event:string,...args:any[]):void{
            this.connection.emit.apply(this.connection,[event].concat(args));
        }
        //サーバーから
        on(event:string,listener:(...args:any[])=>any):void{
            this.connection.on(event,listener);
        }
        once(event:string,listener:(...args:any[])=>any):void{
            this.connection.once(event,listener);
        }
        removeListener(event:string,listener:(...args:any[])=>any){
            this.connection.removeListener(event,listener);
        }
        removeAllListeners(event?:string){
            this.connection.removeAllListeners(event);
        }
    }
    //Socket.ioを用いたコネクション
    export class SocketConnection extends ChatConnection{
        private event:EventEmitter;
        private connection:EventEmitter;
        //コネクションを作る
        initConnection(settings:any):void{
            //connectionはSocket.ioのコネクション
            this.connection=io.connect(settings.SOCKET_HOST_NAME||(location.protocol+"//"+location.host));
            this.connection.once("connect",()=>{
                this.event.emit("connect");
            });

        }
        register(lastid:string,channel:string):void{
            this.send("register",{"mode":"client","lastid":lastid,channel:channel});
        }
        send(event:string,...args:any[]):void{
            //サーバーへ送る
            this.connection.emit.apply(this.connection,[event].concat(args));
        }
    }
    //親ウィンドウに寄生しているコネクション（チャネルウィンドウ用）
    export class ChildConnection extends ChatConnection{
        private event:EventEmitter;
        private connection:EventEmitter;
        private port:MessagePort;
        //リクエストに一意IDをつける
        private requestId=0;
        //ack（コールバックつきメッセージ）につけるID
        private ackId=0;
        private savedAck:any={};
        initConnection(settings:any):void{
            //コネクションを持っておく
            this.connection=getEventEmitter();

            //通信確立は受動的（親から連絡がくるのを待つ）
            window.addEventListener("message",(ev:MessageEvent)=>{
                var d:any=ev.data;
                //通信を確立する（MessagePortをもらう）
                if(d.name==="init"){
                    //portsに通信用のMessagePortが入っている
                    this.port=ev.ports[0];
                    if(!this.port){
                        throw new Error("no port");
                    }
                    this.initPort(this.port);
                    //準備ができたので伝える
                    this.port.postMessage({
                        name:"ready",
                    });
                    this.event.emit("connect");
                }else if(d.name==="ping"){
                    //確認用（送り返す）
                    d.name="pong";
                    ev.source.postMessage(d,ev.origin);
                }
            },false);
            //終了時は親に教える
            window.addEventListener("unload",(ev:Event)=>{
                this.port.postMessage({
                    name:"unload",
                });
            },false);
        }
        // 親へ送る
        push(event:string,args:any[]):void{
            console.log("pushhhh",event,args);
            debugger;
            var func_number:number=0, func_array:{index:number;func:Function;}[]=[];
            var func_index_array:number[]=[];
            for(var i=0,l=args.length;i<l;i++){
                if("function"===typeof args[i]){
                    //関数は送れないぞ!
                    //func_arrayに覚えておく
                    func_array.push({
                        index:func_number+i,
                        func:args[i],
                    });
                    //func_index_arrayで関数の位置を教えてあげる
                    func_index_array.push(func_number+i);
                    args.splice(i,1);
                    i--,l--;
                    func_number++;
                }
            }
            if(func_number>0){
                //関数を送った（レスポンスを期待）→リクエストをとっておく
                this.savedAck[this.ackId]={
                    ackId:this.ackId,
                    func_number:func_number,
                    func_array:func_array,
                };
                //ここからかいてね!
                this.port.postMessage({
                    name:event,
                    args:args,
                    ackId:this.ackId,
                    func_index_array:func_index_array,
                });
                this.ackId++;
            }else{
                this.port.postMessage({
                    name:event,
                    args:args,
                });
            }
        }
        //（親経由で）サーバーへ送る
        send(event:string,...args:any[]):void{
            /*var messageObj:any={
                name:event,
                args:args,
            };
            this.push("message",[messageObj]);*/
            this.push("message",[event].concat(args));
        }
        //ポートを初期化する
        initPort(port:MessagePort):void{
            port.start();   //通信開始
            port.addEventListener("message",(ev:MessageEvent)=>{
                var d=ev.data.args[0];
                if(ev.data.name==="handle"){
                    //handle（イベントが流れてきた）
                    //イベントを発生させる
                    this.connection.emit.apply(this.connection,[d.event].concat(d.args));
                }else if(ev.data.name==="ackresponse"){
                    //コールバックが帰ってきた
                    var obj=this.savedAck[d.ackId];
                    console.log("back!",d,obj,this.savedAck);
                    obj.func_array[d.funcindex].func.apply(this,d.args);
                    //用なし
                    delete this.savedAck[d.ackId];
                }
            },false);
        }
        //コネクション: もらうには親に申請しないといけない
        emit(event:string,...args:any[]):void{
            this.connection.emit.apply(this.connection,[event].concat(args));
        }
        //サーバーから
        on(event:string,listener:(...args:any[])=>any):void{
            this.requestId++;   //新しいID
            var id=this.requestId;  //現在のIDメモ
            //WeakMapが欲しいけど放置
            this.push("request",[event,this.requestId]);
            this.connection.on(event,listener);
        }
        once(event:string,listener:(...args:any[])=>any):void{
            this.requestId++;   //新しいID
            var id=this.requestId;  //現在のIDメモ
            //WeakMapが欲しいけど放置
            this.push("request",[event,this.requestId]);
            this.connection.once(event,listener);
        }
        removeListener(event:string,listener:(...args:any[])=>any){
            this.connection.removeListener(event,listener);
        }
        removeAllListeners(event?:string){
            this.connection.removeAllListeners(event);
        }
    }
    //子どもへ送る処理に関するサブモジュール
    export module ChatHub{
        //ハブ（自分から派生した子ウィンドウに送ってあげる）
        export class Hub{
            private children:Child[];
            constructor(private receiver:ChatReceiver,private connection:ChatConnection){
                this.children=[];
            }
            //子どもを作る!!!
            makeChild(port:MessagePort,closecallback:()=>void):Child{
                var c:Child=new Child(this,port,closecallback);
                //初期化処理をする
                c.init();
                return c;
            }
            //子どもを追加
            addChild(c:Child):void{
                this.children.push(c);
            }
            //子どもを初期化してあげる
            initChild(c:Child,channel:string):void{
                c.imServer(this.receiver,this.connection,channel);
            }
            //子どもを捨てる
            removeChild(c:Child):void{
                this.children=this.children.filter((x:Child)=>x!==c);
            }
            //親コネクションから送る
            send(...args:any[]):void{
                this.connection.send.apply(this.connection,args);
            }
            //コネクション得る
            getConnection():ChatConnection{
                return this.connection;
            }
        }
        //ハブでつながった子ども
        export class Child{
            //内部利用のEmitter
            private event:EventEmitter;
            //ハンドラとリクエストIDを対応付けるマップ
            private requestMap:{ [index:number]:(...args:any[])=>any; };
            //hub:親のハブ
            //port:この子どもに送るためのMessagePort
            constructor(private hub:Hub,private port:MessagePort,private closecallback?:()=>void){
                this.event=getEventEmitter();
                this.requestMap=<{ [index:number]:(...args:any[])=>any; }>{};
            }
            //ポートを使用可能にする
            init():void{
                var port:MessagePort=this.port;
                port.start();
                //メッセージを受け取る
                port.addEventListener("message",(ev:MessageEvent)=>{
                    var d=ev.data;
                    this.handleMessage(d.name,d.args,d.ackId,d.func_index_array);
                });
            }
            //サーバーのようにふるまう（初期化）
            imServer(receiver:ChatReceiver,connection:ChatConnection,channel:string){
                //まずログをとってくる
                connection.findLog({
                    channel:channel
                },(logs:LogObj[])=>{
                    this.sendEvent("init",null,[{
                        logs:logs
                    }]);
                });
                //ユーザー一覧をとってくる
                connection.getUsers((users:UserObj[])=>{
                    this.sendEvent("users",null,[users]);
                });
                //現在の自分の状況をアレする
                this.sendEvent("userinfo",null,[receiver.getUserinfo()]);
            }
            //子どもから送られてきたメッセージを処理する
            handleMessage(event:string,args:any[],ackId:number,func_index_array:number[]):void{
                if("number"===typeof ackId && func_index_array){
                    //ackIdが存在する(or null)・・・コールバックあり
                    //func_array:argsから抜けた関数（コールバック用）
                    for(var i=0,l=func_index_array.length;i<l;i++){
                        //argsに追加してあげる
                        args.splice(func_index_array[i],0,back_handle.bind(this,ackId,i));
                    }
                    //送り返すぞ!
                    function back_handle(ackId:number,funcindex:number,...args:any[]):void{
                        //funcindex:最初の関数が0(func_index_arrayの添字)
                        console.log("back!",ackId,funcindex,args);
                        this.send("ackresponse",{
                            ackId:ackId,
                            funcindex:funcindex,
                            args:args,
                        });
                    }
                }
                //data.name:イベント名
                if(event==="unload"){
                    //実体が閉じられた（役目終了）
                    this.port.close();
                    this.hub.removeChild(this);
                    if(this.closecallback){
                        this.closecallback.call(null);
                    }
                    return;
                }
                //子どもからハンドル要求
                if(event==="request"){
                    //event(string),requestid(number) そのイベントのID
                    var e=this.event, evname:string=args[0], requestid:number=args[1];
                    //ハンドラ登録
                    var handler=(...args:any[])=>{
                        this.sendEvent(evname,requestid,args);
                    };
                    var connection=this.hub.getConnection();
                    connection.on(evname,handler);
                    //リクエストマップに登録（消去時用）
                    this.requestMap[requestid]=handler;
                    return;
                }
                //ハンドルしたリクエストを取り消す
                if(event==="norequest"){
                    var evname:string=args[0], requestid:number=args[1];
                    var func=this.requestMap[requestid];   //そのリスナ
                    if(func){
                        var connection=this.hub.getConnection();
                        connection.removeListener(evname,func);
                        delete this.requestMap[requestid];
                    }
                    return;
                }
                //サーバーへ送りたい
                if(event==="message"){
                    this.hub.send.apply(this.hub,args);
                    return;
                }
            }

            //実体へメッセージ送信
            send(event:string,...args:any[]):void{
                this.port.postMessage({
                    name:event,
                    args:args,
                });
            }
            //イベント発生を通知する
            sendEvent(event:string,requestid:number,args:any[]):void{
                this.send("handle",{
                    args:args,
                    event:event,
                    requestid:requestid,
                });
                    
            }
        }
    }
    // サーバーから情報を受け取るぞ!
    export class ChatReceiver{
        private oldest_time:Date=null;    // 保有している最も古いログ
        private event:EventEmitter; //内部使用
        private hub:ChatHub.Hub;
        //自分用にuserinfoをとっておく
        private myUserinfo:{
            name:string;
            rom:bool;
        };
        private active:bool=false;  //こっちから送っても大丈夫か
        constructor(private connection:ChatConnection,private channel:string){
            this.hub=new ChatHub.Hub(this,connection);
            this.event=getEventEmitter();
            //通信初期化
            connection.on("init",this.loginit.bind(this));
            connection.on("log",this.log.bind(this));
            connection.on("users",this.userinit.bind(this));
            connection.on("userinfo",this.userinfo.bind(this));
            connection.on("newuser",this.newuser.bind(this));
            connection.on("deluser",this.deluser.bind(this));
            connection.on("inout",this.inout.bind(this));
        }
        getHub():ChatHub.Hub{
            return this.hub;
        }
        //サーバーにmottoを要求する
        motto(data:MottoNotify):void{
            if(!data.time){
                data.time=this.oldest_time;
            }
            var query:FindNotify={
                motto:data,
            }
            if(this.channel){
                //チャネルをaddする
                query.channel=this.channel;
            }
            this.connection.send("find",query,(logs:LogObj[])=>{
                if(logs.length>0){
                    this.oldest_time=new Date(logs[logs.length-1].time);
                    this.event.emit("mottoLog",logs);
                }
            });
        }
        //ログを探す
        find(data:FindNotify,callback:(logs:LogObj[])=>void){
            this.connection.send("find",data,callback);
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
        //準備できたら読んで・・・
        ready(callback:()=>void){
            if(this.active){
                callback();
            }else{
                this.once("loginit",callback);
            }
        }
        //最終発言を教えてもらう
        getOldest():Date{
            return this.oldest_time;
        }
        //最初のログを送ってきた
        loginit(data:{logs:LogObj[];}):void{
            //一番古いログをとる
            if(data.logs){
                this.oldest_time=new Date(data.logs[data.logs.length-1].time);
            }
            this.active=true;
            this.event.emit("loginit",data.logs);
        }
        //ログを送ってきた
        log(data:LogObj):void{
            //チャネルフィルター!!
            console.log(data);
            if(this.channel && (!Array.isArray(data.channel) || data.channel.indexOf(this.channel)<0)){
                // チャネルが合わない
                return;
            }
            this.event.emit("log",data);
        }
        //ユーザー一覧だ
        userinit(data:{users:UserObj[];roms:number;active:number;}):void{
            this.event.emit("userinit",data);
        }
        //自分の情報を教えてもらう
        userinfo(data:{name:string;rom:bool;}):void{
            this.myUserinfo=data;
            this.event.emit("userinfo",data);
        }
        getUserinfo(){
            return this.myUserinfo;
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
}
