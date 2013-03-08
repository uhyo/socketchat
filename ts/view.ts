//HTML5 additions for TypeScript lib
interface HTMLTimeElement extends HTMLElement{
    dateTime?:string;
}
interface HTMLElement{
    dataset:any;
    hidden:bool;
}
module Chat{
/// <reference path="connection.ts"/>
/// <reference path="process.ts"/>

    //チャット外観の全体
    export class ChatView{
        private container:HTMLElement;
        private settingView:ChatSettingView;
        private logView:ChatLogView;
        private userView:ChatUserView;
        private ui:ChatUI;

        init(userData:ChatUserData,connection:ChatConnection,receiver:ChatReceiver,process:ChatProcess):void{
            this.container=document.createElement("div");
            //コンテナはbodyに入れる
            document.body.setAttribute('role','application');
            document.body.appendChild(this.container);

            //設定・リンク部分を初期化
            this.settingView=new ChatSettingView(userData,this);
            //ログ表示部分を初期化
            this.logView=new ChatLogView(userData,receiver);
            //ユーザー一覧部分を初期化
            this.userView=new ChatUserView(receiver);
            //ユーザー操作部分を初期化
            this.ui=new ChatUI(userData,receiver,process);
            //UIを組もう!
            this.container.appendChild(this.settingView.getContainer());
            this.container.appendChild(this.ui.getContainer());
            this.container.appendChild(this.logView.getContainer());
            this.container.appendChild(this.userView.getContainer());
        }
        //餃子モードが変更された
        changeGyoza():void{
            //logViewに丸投げ
            this.logView.changeGyoza();
        }
        getContainer():HTMLElement{
            return this.container;
        }
    }
    //設定・リンク部分
    export class ChatSettingView{
        private container:HTMLElement;
        //リンク一覧
        private links:{url:string;name:string;}[]=[
            {
                url:"http://shogitter.com/",
                name:"将棋",
            },
            {
                url:"http://81.la/shogiwiki/",
                name:"wiki",
            },
            {
                url:"http://81.la/cgi-bin/up/",
                name:"up",
            },
            {
                //セパレータ
                url:null,
                name:null,
            },
            {
                url:"/list",
                name:"list",
            },
            {
                url:"/log",
                name:"log",
            },
            {
                url:"/apiclient",
                name:"API",
            },
            {
                url:"/com",
                name:"com",
            },

        ];
        //餃子セッティング一覧
        private gyozaSettings:string[]=["餃子無展開","餃子オンマウス","餃子常時"];
        constructor(private userData:ChatUserData,private view:ChatView){
            this.container=document.createElement("div");
            this.container.classList.add("infobar");
            //まずリンク生成
            this.container.appendChild(this.makeLinks());
            //次に餃子ボタン生成
            this.container.appendChild(this.makeGyozaButton());
            //ボリューム操作生成
            this.container.appendChild(this.makeVolumeRange());
        }
        makeLinks():DocumentFragment{
            var df=document.createDocumentFragment();

            for(var i=0,l=this.links.length;i<l;i++){
                var o=this.links[i];
                if(o.url){
                    var a=<HTMLAnchorElement>document.createElement("a");
                    a.href=o.url;
                    a.target="_blank";
                    a.textContent=o.name;
                    df.appendChild(a);
                    //スペース開ける
                    df.appendChild(document.createTextNode(" "));
                }else{
                    //セパレータ
                    df.appendChild(document.createTextNode("| "));
                }
            }
            return df;
        }
        makeGyozaButton():HTMLElement{
            var button:HTMLInputElement=<HTMLInputElement>document.createElement("input");
            var ud=this.userData;
            button.type="button";
            button.value=this.gyozaSettings[ud.gyoza];
            button.addEventListener("click",(e:Event)=>{
                //クリックされたら変更
                ud.gyoza=(ud.gyoza+1)%this.gyozaSettings.length;
                button.value=this.gyozaSettings[ud.gyoza];
                ud.save();
                //ビューに変更を知らせる
                this.view.changeGyoza();
            },false);
            return button;
        }
        makeVolumeRange():HTMLElement{
            var range=<HTMLInputElement>document.createElement("input");
            var ud=this.userData;
            range.type="range";
            range.min="0", range.max="100", range.step="10";
            range.value=String(ud.volume);
            //変更時
            var timerid=null;
            range.addEventListener("change",(e:Event)=>{
                //毎回saveするのは気持ち悪い。操作終了を待つ
                ud.volume=Number(range.value);
                clearTimeout(timerid);
                timerid=setTimeout(()=>{
                    ud.save();
                },1000);
            },false);
            return range;
        }

        getContainer():HTMLElement{
            return this.container;
        }
    }
    //ログ表示部分
    export class ChatLogView{
        private container:HTMLElement;
        private lineMaker:ChatLineMaker;
        private gyozaOnmouseListener:Function;

        constructor(private userData:ChatUserData,private receiver:ChatReceiver){
            this.lineMaker=new ChatLineMaker(userData);
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
            //餃子オンマウス用の処理入れる
            this.gyozaOnmouseListener=((e:Event)=>{
                var t=<HTMLAnchorElement>e.target;  //先取り
                if(!t.classList.contains("gyoza")){
                    return; //違う
                }
                //既に展開されている場合はとばす
                if(t.classList.contains("gyozaloaded")){
                    return;
                }
                this.lineMaker.checkGyoza(t);
            }).bind(this);
            this.changeGyoza(); //初期設定
        }
        getContainer():HTMLElement{
            return this.container;
        }
        //ログを一つ追加
        getLog(obj:LogObj):void{
            var line:HTMLElement=this.lineMaker.make(obj);
            this.container.insertBefore(line,this.container.firstChild);
        }
        //餃子モード変更された
        changeGyoza():void{
            if(this.userData.gyoza===1){
                //餃子オンマウス
                this.container.addEventListener("mouseover",<(e:Event)=>void>this.gyozaOnmouseListener,false);
            }else{
                //他なら消去
                this.container.removeEventListener("mouseover",<(e:Event)=>void>this.gyozaOnmouseListener,false);
            }
        }
    }
    export interface GyazoSettingObject{
        thumb:bool;  //サムネイル機能ありかどうか
        url:{
            image:string;   //画像のURL（あとにid付加）
            thumb:string;   //サムネイルURL
            ext:bool;   //?
        };
        text:{
            normal: string;
            opening: string;
            error:string;
        };
    }
    //ログからDOMを生成するやつ
    export class ChatLineMaker{
        //餃子設定
        private gyazoSetting:GyazoSettingObject[] = [
            {
                thumb: true,
                url: {
                    image: "http://gyazo.com/",
                    thumb: "http://gyazo.com/thumb/",
                    ext: true,
                },
                text: {
                    normal: "[Gyazo]",
                    opening: "[Gyoza…]",
                    error: "[Gyoza?]",
                }
            },
            {
                thumb: false,
                url: {
                    image: "http://myazo.net/",
                    thumb: "http://myazo.net/s/",
                    ext:true,
                },
                text: {
                    normal: "[Myazo]",
                    opening: "[Myoza…]",
                    error:"[Myoza?]"
                }
            },
            {
                thumb: true,
                url: {
                    image: "http://g.81.la/",
                    thumb: "http://g.81.la/thumbnail.php?id=",
                    ext: false,
                },
                text: {
                    normal: "[81g]",
                    opening: "[81kg…]",
                    error:"[81kg?]",
                }
            }
        ];
        constructor(private userData:ChatUserData){
        }
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
            this.parse(comment);   //解析（URLとか）
            comment.normalize();
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
        //ログを解析して追加する
        parse(rawnode:Node):void{
            var allowed_tag=["s","small","code"];
            if(rawnode.nodeType===Node.TEXT_NODE){
                var node:Text=<Text>rawnode;
                //テキストノード
                if(!node.parentNode)return;
                //先頭から順番に処理
                while(node.nodeValue){
                    var res=node.nodeValue.match(/^\[(\w+?)\]/);
                    //先頭が開始タグ
                    if(res){
                        if(allowed_tag.indexOf(res[1])<0){
                            //そんなタグはないよ!
                            node=node.splitText(res[0].length);
                            continue;
                        }
                        //タグが適用される部分をspanで囲む
                        var span=document.createElement("span");
                        span.classList.add(res[1]);
                        //後ろを一旦全部突っ込む
                        span.textContent=node.nodeValue.slice(res[0].length);
                        if(!span.textContent){
                            //空だったのでキャンセル.タダのテキストとして分離して次へ
                            node=node.splitText(res[0].length);
                            continue;
                        }
                        //処理対象をspanに置き換え
                        node.parentNode.replaceChild(span,node);
                        node=<Text>span.firstChild;
                        continue;
                    }
                    //終了タグ
                    res=node.nodeValue.match(/^\[\/(\w+?)\]/);
                    if(res){
                        if(allowed_tag.indexOf(res[1])<0){
                            node=node.splitText(res[0].length);
                        }
                        //閉じるべきタグを探す
                        var p:Node=node;
                        while(p=p.parentNode){
                            //nodeはテキストノードなので親からスターと
                            var cl=(<HTMLElement>p).classList;
                            if(cl && cl.contains(res[1])){
                                //問題のタグである
                                break;
                            }
                        }
                        //タグを閉じる
                        if(p){
                            //終了タグを取り除いて、nodeの中には終了タグより右側が残る
                            node.nodeValue=node.nodeValue.slice(res[0].length);
                            p.parentNode.insertBefore(node,p.nextSibling);
                        }else{
                            //そのタグはなかった。ただのテキストとして処理
                            node=node.splitText(res[0].length);
                        }
                        continue;
                    }
                    //リンク
                    res=node.nodeValue.match(/^https?:\/\/\S+/);
                    if(res){
                        var matched=false;
                        //URLがgyazo系かどうか調べる
                        for(var i=0,l=this.gyazoSetting.length;i<l;i++){
                            var settingObj:GyazoSettingObject=this.gyazoSetting[i];
                            var res2=res[0].match(new RegExp("^"+settingObj.url.image.replace(".","\\.")+"([0-9a-f]{32})(?:\\.png)?"));
                            if(!res2) continue;

                            //Gyazo
                            var a=<HTMLAnchorElement>document.createElement("a");
                            a.target="_blank";
                            a.href=settingObj.url.image+res2[1]+(settingObj.url.ext?".png":"");
                            a.classList.add("gyoza");
                            if(settingObj.thumb && this.userData.gyoza===2){
                                //餃子常時展開
                                this.openGyoza(settingObj,a,res2[1]);
                            }else{
                                a.textContent=settingObj.text.normal;
                            }
                            //これは処理終了
                            node=node.splitText(res2[0].length);
                            //node.previousSiblingは、 splitTextで切断されたurl部分のテキストノード
                            node.parentNode.replaceChild(a,node.previousSibling);
                            matched=true;
                            break;
                        }
                        if(matched)continue;
                        //通常のリンクだった
                        var a=<HTMLAnchorElement>document.createElement("a");
                        a.href=res[0];
                        a.target="_blank";
                        try{
                            a.textContent=decodeURIComponent(res[0]);
                        }catch(e){
                            a.textContent=res[0];
                        }
                        node=node.splitText(res[0].length);
                        node.parentNode.replaceChild(a,node.previousSibling);
                        continue;
                    }
                    //チャネルリンク
                    res=node.nodeValue.match(/^(\s*)#(\S+)/);
                    if(res){
                        if(res[1]){
                            //前の空白はいらないのでそのまま流す
                            node=node.splitText(res[1].length);
                        }
                        //チャネルのスタイルを変える
                        var span=this.makeChannelSpan(res[2]);
                        //チャネル部分を分離（スペースの分を除く
                        node=node.splitText(res[0].length-res[1].length);
                        node.parentNode.replaceChild(span,node.previousSibling);
                        continue;
                    }
                    //その他　上のマークアップが車で通常の文字列
                    res=node.nodeValue.match(/^(.+?)(?=\[\/?\w+?\]|https?:\/\/|\s+#\S+)/);
                    if(res){
                        node=node.splitText(res[0].length);
                        continue;
                    }
                    //名にもないただのテキスト nodeを空にする
                    node=node.splitText(node.nodeValue.length);
                }
            }else if(rawnode.childNodes){
                //elementノード
                var nodes:Node[]=[];
                //途中でchildNodesが変化するので、処理対象のノードをリストアップ
                for(var i=0,l=rawnode.childNodes.length;i<l;i++){
                    nodes.push(rawnode.childNodes[i]);
                }
                nodes.forEach((x:Node)=>{
                    if(x.parentNode===rawnode)
                        this.parse(x);
                });

            }
        }
        //餃子サムネイルを展開する
        openGyoza(settingObj:GyazoSettingObject,a:HTMLAnchorElement,imageid:string):void{
            //a: [Gyazo]リンク  imageid:32桁のやつ
            //まず中を削る
            while(a.hasChildNodes())a.removeChild(a.firstChild);
            //Loading
            //Textをとっておく（あとで取り除くので）
            var text:Text=document.createTextNode(settingObj.text.opening);
            a.appendChild(text);
            //画像設置
            var img=<HTMLImageElement>document.createElement("img");
            img.classList.add("thumbnail");
            img.hidden=true;
            a.appendChild(img);
            //読み込みをまつ
            img.addEventListener("load",(e:Event)=>{
                //文字列を消して画像を表示
                a.removeChild(text);
                img.hidden=false;
            },false);
            //失敗時
            img.addEventListener("error",(e:Event)=>{
                //文字列変更
                text.data=settingObj.text.error;
                //画像除去
                a.removeChild(img);
            },false);
            img.src=settingObj.url.thumb+imageid+".png";
            img.alt=settingObj.url.image+imageid+".png";
            //開いた印
            a.classList.add("gyozaloaded");
        }
        //餃子を判別した上で展開する
        checkGyoza(a:HTMLAnchorElement):void{
            for(var i=0,l=this.gyazoSetting.length;i<l;i++){
                var settingObj=this.gyazoSetting[i];
                if(!settingObj.thumb)continue;
                var result=a.href.match(new RegExp("^"+settingObj.url.image.replace(".","\\.")+"([0-9a-f]{32})(?:\\.png)?$"));
                if(result){
                    //これだ!
                    this.openGyoza(settingObj,a,result[1]);
                }
            }
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
            this.userNumber.textContent="入室"+dataset.actives+(dataset.roms!=="0"? " (ROM"+dataset.roms+")":"");
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
                if(dataset && dataset.id===String(id)){
                    return <HTMLElement>lis[i];
                }
            }
            return null;
        }
        //誰かが入退室した
        inout(user:UserObj):void{
            var elem=this.getUserElement(user.id);
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

            //操作に対応する
            this.inoutForm.onInout((data:InoutNotify)=>{
                this.process.inout(data);
            });
            this.commentForm.onComment((data:CommentNotify)=>{
                this.process.comment(data);
            });
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
                //フォームを消す
                (<HTMLInputElement>form.elements["comment"]).value="";
            }
            onComment(func:(data:CommentNotify)=>void):void{
                this.event.on("comment",func);
            }
        }
    }
}
