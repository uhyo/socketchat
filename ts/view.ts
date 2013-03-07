//HTML5 additions for TypeScript lib
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
        private userView:ChatUserView;
        private ui:ChatUI;

        init(userData:ChatUserData,connection:ChatConnection,receiver:ChatReceiver,process:ChatProcess):void{
            this.container=document.createElement("div");
            //コンテナはbodyに入れる
            document.body.setAttribute('role','application');
            document.body.appendChild(this.container);

            //ログ表示部分を初期化
            this.logView=new ChatLogView(receiver);
            //ユーザー一覧部分を初期化
            this.userView=new ChatUserView(receiver);
            //ユーザー操作部分を初期化
            this.ui=new ChatUI(userData,receiver,process);
            //UIを組もう!
            this.container.appendChild(this.ui.getContainer());
            this.container.appendChild(this.logView.getContainer());
            this.container.appendChild(this.userView.getContainer());
        }
        getContainer():HTMLElement{
            return this.container;
        }
    }
    //ログ表示部分
    export class ChatLogView{
        private container:HTMLElement;
        private lineMaker:ChatLineMaker=new ChatLineMaker;

        constructor(private receiver:ChatReceiver){
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
    //チャットのユーザー一覧を表示するやつ
    export class ChatUserView{
        private container:HTMLElement;
        private userNumber:HTMLElement;
        private userList:HTMLElement;
        constructor(private receiver:ChatReceiver){
            this.container=document.createElement("div");
            this.container.classList.add("userinfo");
            //ユーザー数表示部分
            this.userNumber=document.createElement("div");
            this.userNumber.classList.add("usernumber");
            this.userNumber.dataset.roms="0";
            this.userNumber.dataset.actives="0";
            this.container.appendChild(this.userNumber);
            //リスト部分
            this.userList=document.createElement("ul");
            this.userList.classList.add("users");
            this.container.appendChild(this.userList);
            //ユーザー情報を監視
            receiver.on("userinit",this.userinit.bind(this));
            receiver.on("newuser",this.newuser.bind(this));
            receiver.on("deluser",this.deluser.bind(this));
            receiver.on("inout",this.inout.bind(this));
        }
        getContainer():HTMLElement{
            return this.container;
        }
        //処理用
        userinit(data:{users:UserObj[];roms:number;active:number;}):void{
            //リストの中を初期化
            var r=document.createRange();
            r.selectNodeContents(this.userList);
            r.deleteContents();
            r.detach();
            //数の情報を更新
            this.userNumber.dataset.actives="0";
            this.userNumber.dataset.roms="0";
            data.users.forEach(this.newuser,this);
        }
        //人数をセットして反映
        setusernumber(actives:number,roms:number):void{
            var dataset=this.userNumber.dataset;
            dataset.actives=String(parseInt(dataset.actives)+actives);
            dataset.roms=String(parseInt(dataset.roms)+roms);
            this.userNumber.textContent="入室"+dataset.actives+(dataset.roms!==0? " (ROM"+dataset.roms+")":"");
        }
        newuser(user:UserObj):void{
            if(user.rom){
                //romだ!(数だけ変更)
                //rom+1
                this.setusernumber(0, 1);
                return;
            }
            //activeユーザー追加
            this.setusernumber(1, 0);
            this.newuserinfo(user);
        }
        newuserinfo(user:UserObj):void{
            var li:HTMLElement=document.createElement("li");
            var sp:HTMLElement=document.createElement("span");
            sp.textContent=user.name;
            sp.title=user.ip+" / "+user.ua;
            li.dataset.id=user.id;
            li.dataset.ip=user.ip;
            li.appendChild(sp);
            this.userList.appendChild(li);
        }
        //誰かがお亡くなりに
        deluser(userid:number):void{
            var elem=this.getUserElement(userid);
            if(!elem){
                //ROMユーザーだろう
                this.setusernumber(0, -1);
                return;
            }
            //アクティブユーザーだ
            this.setusernumber(-1, 0);
            this.userList.removeChild(elem);
        }
        //そのユーザーを表すやつを手に入れる
        getUserElement(id:number):HTMLElement{
            var lis=this.userList.childNodes;
            for(var i=0,l=lis.length;i<l;i++){
                var dataset=(<HTMLElement>lis[i]).dataset;
                console.log(dataset);
                if(dataset && dataset.id===String(id)){
                    return <HTMLElement>lis[i];
                }
            }
            return null;
        }
        //誰かが入退室した
        inout(user:UserObj):void{
            var elem=this.getUserElement(user.id);
            console.log(user,elem);
            if(elem){
                //古いのはいらない
                this.userList.removeChild(elem);
            }
            if(user.rom){
                //activeからromになった
                this.setusernumber(-1, 1);
            }else{
                //romからactiveになった
                this.setusernumber(1, -1);
                //用意してあげる
                this.newuserinfo(user);
            }
        }

    }
    //発言などのUI部分
    export class ChatUI{
        private container:HTMLElement;
        //パーツたち
        private inoutForm:ChatUICollection.InoutForm;
        private commentForm:ChatUICollection.CommentForm;

        constructor(private userData:ChatUserData,private receiver:ChatReceiver,private process:ChatProcess){
            this.container=document.createElement("div");
            this.container.classList.add("ui");
            //フォーム用意
            //まず入退室フォーム
            this.inoutForm=new ChatUICollection.InoutForm(this.userData,this.receiver,this.process);
            this.container.appendChild(this.inoutForm.getContainer());
            //次に発言フォーム
            this.commentForm=new ChatUICollection.CommentForm(this.userData,this.receiver,this.process);
            this.container.appendChild(this.commentForm.getContainer());
        }
        getContainer():HTMLElement{
            return this.container;
        }
    }
    //UIパーツ
    export module ChatUICollection{
        export class UIObject{
            private event:EventEmitter;
            private container:HTMLElement;
            constructor(){
                this.event=getEventEmitter();
            }
            getContainer():HTMLElement{
                return this.container;
            }
            //inputを作る
            makeinput(callback:(input:HTMLInputElement)=>void):HTMLInputElement{
                var result=<HTMLInputElement>document.createElement("input");
                callback(result);
                return result;
            }
        }
        //入退室フォーム
        export class InoutForm extends UIObject{
            private event:EventEmitter;
            private container:HTMLFormElement;
            constructor(private userData:ChatUserData,private receiver:ChatReceiver,private process:ChatProcess){
                super();
                this.container=<HTMLFormElement>document.createElement("form");
                var p:HTMLParagraphElement;

                p=<HTMLParagraphElement>document.createElement("p");
                this.container.appendChild(p);

                //まず名前フォーム
                p.appendChild(this.makeinput(input=>{
                    input.name="uname";
                    input.size=20;
                    input.maxLength=25;
                    input.required=true;
                    input.placeholder="名前";
                    //最初
                    input.value = this.userData.name || "";
                }));
                //入退室ボタン
                p.appendChild(this.makeinput(input=>{
                    input.name="inoutbutton";
                    input.type="submit";
                    input.value="入室";
                }));
                //入退室時にフォームがかわる
                this.receiver.on("userinfo",(data:{name:string;rom:bool;})=>{
                    (<HTMLInputElement>this.container.elements["uname"]).disabled = !data.rom;
                    (<HTMLInputElement>this.container.elements["inoutbutton"]).value = data.rom ? "入室" : "退室";
                });
                this.container.addEventListener("submit",(e:Event)=>{
                    e.preventDefault();
                    this.emitInout(e);
                },false);
            }
            //入退室ボタンが押されたときの処理
            emitInout(e:Event):void{
                var data:InoutNotify={
                    name:(<HTMLInputElement>this.container.elements["uname"]).value,
                };
                this.event.emit("inout",data);
            }
            onInout(func:(data:InoutNotify)=>void):void{
                this.event.on("inout",func);
            }
        }
        //入退室フォーム
        export class CommentForm extends UIObject{
            private event:EventEmitter;
            private container:HTMLFormElement;
            constructor(private userData:ChatUserData,private receiver:ChatReceiver,private process:ChatProcess){
                super();
                this.container=<HTMLFormElement>document.createElement("form");
                var p:HTMLParagraphElement;

                p=<HTMLParagraphElement>document.createElement("p");
                this.container.appendChild(p);

                //発言欄
                p.appendChild(this.makeinput(input=>{
                    input.name="comment";
                    input.type="text";
                    input.size=60;
                    input.autocomplete="off";
                    input.required=true;
                }));
                p.appendChild(document.createTextNode("#"));
                //チャネル欄
                p.appendChild(this.makeinput(input=>{
                    input.name="channel";
                    input.type="text";
                    input.size=10;
                }));
                //発言ボタン
                p.appendChild(this.makeinput(input=>{
                    input.name="commentbutton";
                    input.type="submit";
                    input.value="発言";
                }));
                this.container.addEventListener("submit",(e:Event)=>{
                    e.preventDefault();
                    this.emitComment(e);
                },false);

            }
            //入退室ボタンが押されたときの処理
            emitComment(e:Event):void{
                var form=this.container;
                //チャネル
                var channel:string[]=null;
                var channelvalue:string=(<HTMLInputElement>form.elements["channel"]).value;
                if(channelvalue){
                    channel=[channelvalue];
                }
                var data:CommentNotify={
                    comment:(<HTMLInputElement>form.elements["comment"]).value,
                    response:null,
                    channel:channel,
                };
                this.event.emit("comment",data);
            }
            onComment(func:(data:CommentNotify)=>void):void{
                this.event.on("comment",func);
            }
        }
    }
}
