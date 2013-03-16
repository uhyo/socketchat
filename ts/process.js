var Chat;
(function (Chat) {
    var ChatUserData = (function () {
        function ChatUserData() { }
        ChatUserData.prototype.load = function () {
            this.lastid = localStorage.getItem("lastid") || null;
            this.name = localStorage.getItem("socketchat_name") || null;
            this.gyoza = Number(localStorage.getItem("gyoza")) || 0;
            this.volume = Number(localStorage.getItem("volume"));
            if(isNaN(this.volume)) {
                this.volume = 50;
            }
            this.channelMode = Number(localStorage.getItem("channelMode")) || 0;
            var disi = localStorage.getItem("disip");
            this.disip = disi ? JSON.parse(disi) : [];
            var disc = localStorage.getItem("dischannel");
            this.dischannel = disc ? JSON.parse(disc) : [];
            var cmd = localStorage.getItem("cmd");
            this.cmd = cmd ? JSON.parse(cmd) : {
                height: "30em",
                syschar: "\\"
            };
            this.autoin = !!localStorage.getItem("socketchat_autoin");
        };
        ChatUserData.prototype.save = function () {
            if("string" === typeof this.lastid) {
                localStorage.setItem("lastid", this.lastid);
            }
            if("string" === typeof this.name) {
                localStorage.setItem("socketchat_name", this.name);
            }
            localStorage.setItem("gyoza", String(this.gyoza));
            localStorage.setItem("volume", String(this.volume));
            localStorage.setItem("channelMode", String(this.channelMode));
            localStorage.setItem("disip", JSON.stringify(this.disip));
            localStorage.setItem("dischannel", JSON.stringify(this.dischannel));
            localStorage.setItem("cmd", JSON.stringify(this.cmd));
            if(this.autoin) {
                localStorage.setItem("socketchat_autoin", "true");
            } else {
                localStorage.removeItem("socketchat_autoin");
            }
        };
        return ChatUserData;
    })();
    Chat.ChatUserData = ChatUserData;    
    var ChatProcess = (function () {
        function ChatProcess(connection, receiver, userData, channel) {
            this.connection = connection;
            this.receiver = receiver;
            this.userData = userData;
            this.channel = channel;
            var _this = this;
            if(userData.autoin && userData.name) {
                receiver.ready(function () {
                    _this.inout({
                        name: userData.name
                    }, "in");
                });
            }
        }
        ChatProcess.prototype.inout = function (data, operation) {
            if(operation) {
                var userinfo = this.receiver.getUserinfo();
                console.log(userinfo);
                if(operation === "in") {
                    if(userinfo.rom !== true) {
                        return false;
                    }
                } else if(operation === "out") {
                    if(userinfo.rom === true) {
                        return false;
                    }
                }
            }
            this.connection.send("inout", data);
            if(data.name) {
                this.userData.name = data.name;
                this.userData.save();
            }
            return true;
        };
        ChatProcess.prototype.comment = function (data) {
            if(this.channel) {
                var ch = data.channel ? data.channel : [];
                if(ch.indexOf(this.channel) < 0) {
                    ch.push(this.channel);
                    data.channel = ch;
                }
            }
            this.connection.send("say", data);
        };
        ChatProcess.prototype.motto = function (data) {
            this.receiver.motto(data);
        };
        ChatProcess.prototype.openChannel = function (channelname, closecallback) {
            var _this = this;
            sessionStorage.setItem("independent_flag", "true");
            var win = window.open(location.pathname + "#" + channelname);
            var wait = 100, count = 0;
            var timerid = null;
            var listener;
            window.addEventListener("message", listener = function (e) {
                var d = e.data;
                if(d.name === "pong") {
                    clearTimeout(timerid);
                    window.removeEventListener("message", listener);
                    var channel = new MessageChannel();
                    channel.port1.start();
                    var ls;
                    channel.port1.addEventListener("message", ls = function (e) {
                        var d = e.data;
                        if(d.name === "ready") {
                            channel.port1.removeEventListener("message", ls);
                            var hub = _this.receiver.getHub();
                            var child = hub.makeChild(channel.port1, closecallback);
                            hub.addChild(child);
                            hub.initChild(child, channelname);
                            delete sessionStorage.removeItem("independent_flag");
                        }
                    });
                    win.postMessage({
                        name: "init"
                    }, "*", [
                        channel.port2
                    ]);
                }
            });
            ping();
            function ping() {
                win.postMessage({
                    name: "ping"
                }, "*");
                timerid = setTimeout(ping, wait);
            }
        };
        return ChatProcess;
    })();
    Chat.ChatProcess = ChatProcess;    
})(Chat || (Chat = {}));
