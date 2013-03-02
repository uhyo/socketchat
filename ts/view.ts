//TypeScriptが知らないので自分でサポート
interface HTMLTimeElement extends HTMLElement{
    dateTime?:string;
}
interface HTMLElement{
    dataset:any;
}
module Chat{
/// <reference path="connection.ts"/>
/// <reference path="process.ts"/>

    //チャット外観の全体
    export class ChatView{
        private container:HTMLElement;
        private logView:ChatLogView;

        init(connection:ChatConnection,receiver:ChatReceiver):void{
            this.container=document.createElement("div");
            //コンテナはbodyに入れる
            document.body.setAttribute('role','application');
            document.body.appendChild(this.container);

            //ログ表示部分を初期化
            this.logView=new ChatLogView;
            this.logView.init(receiver);
            //UIを組もう!
            this.container.appendChild(this.logView.getContainer());
        }
        getContainer():HTMLElement{
            return this.container;
        }
    }
    //ログ表示部分
    export class ChatLogView{
        private container:HTMLElement;
        private receiver:ChatReceiver;
        private lineMaker:ChatLineMaker=new ChatLineMaker;

        init(receiver:ChatReceiver):void{
            this.receiver=receiver;
            this.container=document.createElement("div");
            this.container.setAttribute('role','log');
            this.container.classList.add("logbox");
            //流れてきたログをキャッチ!!
            //ログたくさんきた
            receiver.on("loginit",(logs:LogObj[])=>{
                //逆にしてアレする
                logs.reverse().forEach((log:LogObj)=>{
                    this.getLog(log);
                });
            });
            //ログひとつきた
            receiver.on("log",(log:LogObj)=>{
                this.getLog(log);
            });
        }
        getContainer():HTMLElement{
            return this.container;
        }
        //ログを一つ追加
        getLog(obj:LogObj):void{
            var line:HTMLElement=this.lineMaker.make(obj);
            this.container.insertBefore(line,this.container.firstChild);
        }
    }
    //ログからDOMを生成するやつ
    export class ChatLineMaker{
        make(obj:LogObj):HTMLParagraphElement{
            var p=<HTMLParagraphElement>document.createElement("p");
            if(obj.syslog){
                //システムログ
                p.classList.add("syslog");
            }
            var color:string=this.getColorByIP(obj.ip); //ログの色
            //名前部分の生成
            var name=el("bdi",obj.name);
            name.classList.add("name");
            name.style.color=color;
            p.appendChild(name);
            //名前以外の部分の生成
            var main=document.createElement("span");
            main.classList.add("main");
            //コメント部分の生成
            var comment=document.createElement("bdi");
            comment.appendChild(this.commentHTMLify(obj.commentObject || obj.comment));
            main.appendChild(comment);
            //チャネル
            if(obj.channel){
                //配列か
                var c:string[] = Array.isArray(obj.channel) ? obj.channel : [obj.channel];
                for(var i=0,l=c.length;i<l;i++){
                    //ログのチャンネル名と、本文中のハッシュタグがかぶる場合は本文を優先
                    if(obj.comment.indexOf("#"+c[i])===-1){
                        main.appendChild(this.makeChannelSpan(c[i]));
                    }
                }
                //コメントにも情報付加
                p.dataset.channel=c.map((ch:string)=>this.createChannelDatasetString(ch)).join(" ");
            }
            //時間などの情報
            var info=document.createElement("span");
            info.classList.add("info");
            var date:Date=new Date(obj.time);
            //日付
            var datestring:string=date.getFullYear()+"-"+zero2(date.getMonth()+1)+"-"+zero2(date.getDate());
            //時刻
            var timestring:string=zero2(date.getHours())+":"+zero2(date.getMinutes())+":"+zero2(date.getSeconds());
            //時間表示
            var time=<HTMLTimeElement>document.createElement("time");
            var dateelement=el("span",datestring);
            dateelement.classList.add("date");
            var timeelement=el("span"," "+timestring);
            timeelement.classList.add("time");
            time.appendChild(dateelement);
            time.appendChild(timeelement);
            time.appendChild(document.createTextNode("; "));
            time.dateTime=datestring+"T"+timestring;
            info.appendChild(time);
            //コメントに付加情報
            p.dataset.id=obj._id;
            p.dataset.ip=obj.ip;
            //IPアドレス情報
            var ipstring:string = obj.ip+(obj.ipff ? " (forwarded for: "+obj.ipff+")" : "");
            var ipelement=el("span",ipstring+";");
            ipelement.classList.add("ip");
            info.appendChild(ipelement);
            //なぜか名前にも
            name.title=datestring+" "+timestring+", "+ipstring;
            //まとめる
            main.appendChild(info);
            main.style.color=color;
            p.appendChild(main);

            return p;

            //補助：中身をきめて作る
            function el(name:string,content:string):HTMLElement{
                var result=document.createElement(name);
                result.textContent=content;
                return result;
            }
            //補助: 2桁に0で埋める
            function zero2(num:number):string{
                return ("00"+num).slice(-2);
            }
        }
        // IPアドレスから色を決める
        getColorByIP(ip:string):string{
            var arr:string[]=ip.split(/\./);
            return "rgb("+Math.floor(parseInt(arr[0])*0.75)+","+
            Math.floor(parseInt(arr[1])*0.75)+","+
            Math.floor(parseInt(arr[2])*0.75)+")";
        }
        //コメントがオブジェクトのときはHTMLにする
        commentHTMLify(comment:any):Node{
            if("string"===typeof comment){
                //テキストならテキストノード
                return document.createTextNode(comment);
            }else if(Array.isArray(comment)){
                //配列のとき：全部つなげる
                var df=document.createDocumentFragment();
                comment.forEach((x:any)=>{
                    df.appendChild(this.commentHTMLify(x));
                });
                return df;
            }else{
                //オブジェクトの場合
                //name:要素名 attributes: key-valueのオブジェクト style:key-valueのCSSスタイル
                //child: 中身(CommentObject)
                var elm=document.createElement(comment.name);
                for(var i in comment.attributes){
                    elm.setAttribute(i,comment.attributes[i]);
                }
                for(var i in comment.style){
                    elm.style.setProperty(i,comment.style[i],null);
                }
                elm.appendChild(this.commentHTMLify(comment.child));
                return elm;
            }
        }
        //チャネル表示
        makeChannelSpan(channel:string):HTMLElement{
            var span=document.createElement("span");
            span.className="channels";
            var wholeChannel:string="";
            var channels:string[]=channel.split("/");
            for(var i=0,l=channels.length;i<l;i++){
                span.appendChild(((i:number,ch:string)=>{
                    var span=document.createElement("span");
                    span.className="channel";
                    if(i===0){
                        wholeChannel=ch;
                        span.textContent= "#"+ch;
                    }else{
                        wholeChannel+="/"+ch;
                        span.textContent="/"+ch;
                    }
                    span.dataset.channel=wholeChannel;
                    return span;
                })(i,channels[i]));
            }
            return span;
        }
        //?????
        createChannelDatasetString(channel:string):string{
            return channel.replace(/\//g,"-");
        }
    }
}
