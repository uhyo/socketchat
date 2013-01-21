declare var io:any;
module Chat{
    interface EventEmitter{
        addListener:(event:string,listener:(...args:any[])=>any)=>void;
        on:(event:string,listener:(...args:any[])=>any)=>void;
        once:(event:string,listener:(...args:any[])=>any)=>void;
        removeListener:(event:string,listener:(...args:any[])=>any)=>void;
        removeAllListeners:(event?:string)=>void;
        listeners:(event:string)=>any;
        emit:(event:string,...args:any[])=>void;
    }
    
    //EventEmitter constructor
    function getEventEmitter():EventEmitter{
        return new io.EventEmitter;
    }
    class ChatConnection{
        //ソケット
        private connection: EventEmitter;
        
        //コネクション初期化メソッド
        initConnection(settings:any):void{
            //ダミーだけど・・・
            this.connection=getEventEmitter();
        }
        //サーバーに登録
        register(lastid:string,channel:string):void{
            //lastid: 前回のセッションID（自動復帰可能）, channel:チャネル
        }
        //サーバーへコマンド発行（socket.ioのemit）
        send(event:string,...args:any[]):void{
        }
        //--connection操作
        //サーバーへプッシュ
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
            this.connection.once(event,listener);
        }
        removeAllListeners(event?:string){
            this.connection.removeAllListeners(event);
        }
    }
    //Socket.ioを用いたコネクション
    class SocketConnection extends ChatConnection{
        private connection:EventEmitter;
        //コネクションを作る
        initConnection(settings:any):void{
            //connectionはSocket.ioのコネクション
            this.connection=io.connect(settings.SOCKET_HOST_NAME||(location.protocol+"//"+location.host));

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
    class ChildConnection extends ChatConnection{
        private connection:EventEmitter;
        private port:MessagePort;
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
        send(event:string,...args:any[]):void{
            //not implemented yet
        }
        //ポートを初期化する
        initPort(port:MessagePort):void{
            port.start();   //通信開始
            port.addEventListener("message",(ev:MessageEvent)=>{
                var d=ev.data;
                //イベントを発生させる
                this.connection.emit.apply(this.connection,[d.name].concat(d.args));
            },false);
        }
    }
}
