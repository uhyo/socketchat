/// <reference path="definition.ts"/>
/// <reference path="connection.ts"/>
var Chat;
(function (Chat) {
    //-----------------
    //ユーザーの情報を保存するぞ!
    var ChatUserData = (function () {
        function ChatUserData() {
        }
        //読み込み
        ChatUserData.prototype.load = function () {
            this.lastid = localStorage.getItem("lastid") || null;
            this.name = localStorage.getItem("socketchat_name") || null;
            this.gyoza = Number(localStorage.getItem("gyoza") || 2);
            this.volume = Number(localStorage.getItem("volume"));
            if (isNaN(this.volume))
                this.volume = 50;
            this.channelMode = Number(localStorage.getItem("channelMode")) || 0;
            //dischannel
            var disi = localStorage.getItem("disip");
            this.disip = disi ? JSON.parse(disi) : [];
            var disc = localStorage.getItem("dischannel");
            this.dischannel = disc ? JSON.parse(disc) : [];
            var cmd = localStorage.getItem("cmd");
            this.cmd = cmd ? JSON.parse(cmd) : {
                height: "30em", syschar: "\\"
            };
            //autoin
            this.autoin = !!localStorage.getItem("socketchat_autoin");
        };
        //保存
        ChatUserData.prototype.save = function () {
            if ("string" === typeof this.lastid)
                localStorage.setItem("lastid", this.lastid);
            if ("string" === typeof this.name)
                localStorage.setItem("socketchat_name", this.name);
            localStorage.setItem("gyoza", String(this.gyoza));
            localStorage.setItem("volume", String(this.volume));
            localStorage.setItem("channelMode", String(this.channelMode));
            localStorage.setItem("disip", JSON.stringify(this.disip));
            localStorage.setItem("dischannel", JSON.stringify(this.dischannel));
            localStorage.setItem("cmd", JSON.stringify(this.cmd));
            if (this.autoin) {
                localStorage.setItem("socketchat_autoin", "true");
            }
            else {
                localStorage.removeItem("socketchat_autoin");
            }
        };
        return ChatUserData;
    }());
    Chat.ChatUserData = ChatUserData;
    //チャットの動作管理をするぞ！
    var ChatProcess = (function () {
        //コネクション
        function ChatProcess(connection, receiver, userData, channel) {
            var _this = this;
            this.connection = connection;
            this.receiver = receiver;
            this.userData = userData;
            this.channel = channel;
            if (userData.autoin && userData.name) {
                receiver.ready(function () {
                    _this.inout({
                        name: userData.name
                    }, "in");
                });
            }
        }
        //入退室する
        ChatProcess.prototype.inout = function (data, operation) {
            if (operation) {
                //operationがあるとき:一方通行
                var userinfo = this.receiver.getUserinfo();
                console.log(userinfo);
                if (operation === "in") {
                    if (userinfo.rom !== true) {
                        return false;
                    }
                }
                else if (operation === "out") {
                    if (userinfo.rom === true) {
                        return false;
                    }
                }
            }
            //サーバーに送る
            this.connection.send("inout", data);
            //名前保存
            if (data.name) {
                this.userData.name = data.name;
                this.userData.save();
            }
            return true;
        };
        //コメントする
        ChatProcess.prototype.comment = function (data) {
            //チャネル追加
            if (this.channel) {
                var ch = data.channel ? data.channel : [];
                if (ch.indexOf(this.channel) < 0) {
                    //まだない
                    ch.push(this.channel);
                    data.channel = ch;
                }
            }
            this.connection.send("say", data);
        };
        //motto!(丸投げ)
        ChatProcess.prototype.motto = function (data) {
            this.receiver.motto(data);
        };
        //チャネルウィンドウを開く
        ChatProcess.prototype.openChannel = function (channelname, closecallback) {
            var _this = this;
            sessionStorage.setItem("independent_flag", "true"); //子ウィンドウに大して子であると伝える
            var win = window.open(location.pathname + "#" + channelname);
            //まず通信を確立する
            var wait = 100, count = 0;
            var timerid = null;
            var listener;
            window.addEventListener("message", listener = function (e) {
                var d = e.data;
                if (d.name === "pong") {
                    //データが帰ってきた！通信準備
                    clearTimeout(timerid);
                    window.removeEventListener("message", listener);
                    //情報を送る
                    var channel = new MessageChannel();
                    channel.port1.start();
                    var ls;
                    channel.port1.addEventListener("message", ls = function (e) {
                        var d = e.data;
                        if (d.name === "ready") {
                            //通信準備ができた
                            channel.port1.removeEventListener("message", ls);
                            //子として登録
                            var hub = _this.receiver.getHub();
                            var child = hub.makeChild(channel.port1, closecallback);
                            hub.addChild(child);
                            hub.initChild(child, channelname);
                            //ここからかこう!
                            delete sessionStorage.removeItem("independent_flag");
                        }
                    });
                    //初期化してあげる
                    win.postMessage({
                        name: "init"
                    }, "*", [channel.port2]);
                }
            });
            ping();
            function ping() {
                //送る（反応あったら受付開始したとわかる）
                win.postMessage({
                    name: "ping"
                }, "*");
                //次のpingを用意
                timerid = setTimeout(ping, wait);
            }
        };
        return ChatProcess;
    }());
    Chat.ChatProcess = ChatProcess;
})(Chat || (Chat = {}));
