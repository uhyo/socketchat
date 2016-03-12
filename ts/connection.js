var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="definition.ts"/>
var Chat;
(function (Chat) {
    //EventEmitter constructor
    function getEventEmitter() {
        return new io.EventEmitter;
    }
    Chat.getEventEmitter = getEventEmitter;
    var ChatConnection = (function () {
        function ChatConnection() {
            this.event = getEventEmitter();
        }
        //コネクション初期化メソッド
        ChatConnection.prototype.initConnection = function (settings) {
            //ダミーだけど・・・
            this.connection = getEventEmitter();
        };
        //サーバーに登録
        ChatConnection.prototype.register = function (lastid, channel, mode) {
            //lastid: 前回のセッションID（自動復帰可能）, channel:チャネル
        };
        //コネクション確立したら
        ChatConnection.prototype.onConnection = function (func) {
            this.event.on("connect", func);
        };
        //サーバーからログ探す
        ChatConnection.prototype.findLog = function (query, callback) {
            this.send("find", query, function (arr) {
                if (!Array.isArray(arr)) {
                    callback([]);
                }
                else {
                    callback(arr);
                }
            });
        };
        //ユーザー一覧をサーバーから取得する
        ChatConnection.prototype.getUsers = function (callback) {
            this.send("users", function (arr) {
                callback(arr);
            });
        };
        //サーバーへコマンド発行（socket.ioのemit）
        ChatConnection.prototype.send = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
        };
        //--connection操作
        ChatConnection.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.connection.emit.apply(this.connection, [event].concat(args));
        };
        //サーバーから
        ChatConnection.prototype.on = function (event, listener) {
            this.connection.on(event, listener);
        };
        ChatConnection.prototype.once = function (event, listener) {
            this.connection.once(event, listener);
        };
        ChatConnection.prototype.removeListener = function (event, listener) {
            this.connection.removeListener(event, listener);
        };
        ChatConnection.prototype.removeAllListeners = function (event) {
            this.connection.removeAllListeners(event);
        };
        return ChatConnection;
    }());
    Chat.ChatConnection = ChatConnection;
    //Socket.ioを用いたコネクション
    var SocketConnection = (function (_super) {
        __extends(SocketConnection, _super);
        function SocketConnection() {
            _super.apply(this, arguments);
        }
        //private event:EventEmitter;
        //private connection:EventEmitter;
        //コネクションを作る
        SocketConnection.prototype.initConnection = function (settings) {
            var _this = this;
            //connectionはSocket.ioのコネクション
            this.connection = io.connect(settings.SOCKET_HOST_NAME || (location.protocol + "//" + location.host));
            this.connection.once("connect", function () {
                _this.event.emit("connect", _this.connection.socket.sessionid);
            });
        };
        SocketConnection.prototype.register = function (lastid, channel, mode) {
            var _this = this;
            if (mode === void 0) { mode = "client"; }
            //client・・・チャットユーザー
            this.send("register", { "mode": mode, "lastid": lastid, channel: channel });
            this.connection.on("reconnect", function () {
                //再接続時には登録しなおす
                _this.send("register", { "mode": mode, "lastid": lastid, channel: channel });
            });
        };
        SocketConnection.prototype.send = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            //サーバーへ送る
            this.connection.emit.apply(this.connection, [event].concat(args));
        };
        return SocketConnection;
    }(ChatConnection));
    Chat.SocketConnection = SocketConnection;
    //親ウィンドウに寄生しているコネクション（チャネルウィンドウ用）
    var ChildConnection = (function (_super) {
        __extends(ChildConnection, _super);
        function ChildConnection() {
            _super.apply(this, arguments);
            //リクエストに一意IDをつける
            this.requestId = 0;
            //ack（コールバックつきメッセージ）につけるID
            this.ackId = 0;
            this.savedAck = {};
        }
        ChildConnection.prototype.initConnection = function (settings) {
            var _this = this;
            //コネクションを持っておく
            this.connection = getEventEmitter();
            //通信確立は受動的（親から連絡がくるのを待つ）
            window.addEventListener("message", function (ev) {
                var d = ev.data;
                //通信を確立する（MessagePortをもらう）
                if (d.name === "init") {
                    //portsに通信用のMessagePortが入っている
                    _this.port = ev.ports[0];
                    if (!_this.port) {
                        throw new Error("no port");
                    }
                    _this.initPort(_this.port);
                    //準備ができたので伝える
                    _this.port.postMessage({
                        name: "ready"
                    });
                    _this.event.emit("connect", null);
                }
                else if (d.name === "ping") {
                    //確認用（送り返す）
                    d.name = "pong";
                    ev.source.postMessage(d, ev.origin);
                }
            }, false);
            //終了時は親に教える
            window.addEventListener("unload", function (ev) {
                _this.port.postMessage({
                    name: "unload"
                });
            }, false);
        };
        // 親へ送る
        ChildConnection.prototype.push = function (event, args) {
            console.log("pushhhh", event, args);
            debugger;
            var func_number = 0, func_array = [];
            var func_index_array = [];
            for (var i = 0, l = args.length; i < l; i++) {
                if ("function" === typeof args[i]) {
                    //関数は送れないぞ!
                    //func_arrayに覚えておく
                    func_array.push({
                        index: func_number + i,
                        func: args[i]
                    });
                    //func_index_arrayで関数の位置を教えてあげる
                    func_index_array.push(func_number + i);
                    args.splice(i, 1);
                    i--, l--;
                    func_number++;
                }
            }
            if (func_number > 0) {
                //関数を送った（レスポンスを期待）→リクエストをとっておく
                this.savedAck[this.ackId] = {
                    ackId: this.ackId,
                    func_number: func_number,
                    func_array: func_array
                };
                //ここからかいてね!
                this.port.postMessage({
                    name: event,
                    args: args,
                    ackId: this.ackId,
                    func_index_array: func_index_array
                });
                this.ackId++;
            }
            else {
                this.port.postMessage({
                    name: event,
                    args: args
                });
            }
        };
        //（親経由で）サーバーへ送る
        ChildConnection.prototype.send = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            /*var messageObj:any={
                name:event,
                args:args,
            };
            this.push("message",[messageObj]);*/
            this.push("message", [event].concat(args));
        };
        //ポートを初期化する
        ChildConnection.prototype.initPort = function (port) {
            var _this = this;
            port.start(); //通信開始
            port.addEventListener("message", function (ev) {
                var d = ev.data.args[0];
                if (ev.data.name === "handle") {
                    //handle（イベントが流れてきた）
                    //イベントを発生させる
                    _this.connection.emit.apply(_this.connection, [d.event].concat(d.args));
                }
                else if (ev.data.name === "ackresponse") {
                    //コールバックが帰ってきた
                    var obj = _this.savedAck[d.ackId];
                    console.log("back!", d, obj, _this.savedAck);
                    obj.func_array[d.funcindex].func.apply(_this, d.args);
                    //用なし
                    delete _this.savedAck[d.ackId];
                }
            }, false);
        };
        //コネクション: もらうには親に申請しないといけない
        ChildConnection.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.connection.emit.apply(this.connection, [event].concat(args));
        };
        //サーバーから
        ChildConnection.prototype.on = function (event, listener) {
            this.requestId++; //新しいID
            var id = this.requestId; //現在のIDメモ
            //WeakMapが欲しいけど放置
            this.push("request", [event, this.requestId]);
            this.connection.on(event, listener);
        };
        ChildConnection.prototype.once = function (event, listener) {
            this.requestId++; //新しいID
            var id = this.requestId; //現在のIDメモ
            //WeakMapが欲しいけど放置
            this.push("request", [event, this.requestId]);
            this.connection.once(event, listener);
        };
        ChildConnection.prototype.removeListener = function (event, listener) {
            this.connection.removeListener(event, listener);
        };
        ChildConnection.prototype.removeAllListeners = function (event) {
            this.connection.removeAllListeners(event);
        };
        return ChildConnection;
    }(ChatConnection));
    Chat.ChildConnection = ChildConnection;
    //子どもへ送る処理に関するサブモジュール
    var ChatHub;
    (function (ChatHub) {
        //ハブ（自分から派生した子ウィンドウに送ってあげる）
        var Hub = (function () {
            function Hub(receiver, connection) {
                this.receiver = receiver;
                this.connection = connection;
                this.children = [];
            }
            //子どもを作る!!!
            Hub.prototype.makeChild = function (port, closecallback) {
                var c = new Child(this, port, closecallback);
                //初期化処理をする
                c.init();
                return c;
            };
            //子どもを追加
            Hub.prototype.addChild = function (c) {
                this.children.push(c);
            };
            //子どもを初期化してあげる
            Hub.prototype.initChild = function (c, channel) {
                c.imServer(this.receiver, this.connection, channel);
            };
            //子どもを捨てる
            Hub.prototype.removeChild = function (c) {
                this.children = this.children.filter(function (x) { return x !== c; });
            };
            //親コネクションから送る
            Hub.prototype.send = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                this.connection.send.apply(this.connection, args);
            };
            //コネクション得る
            Hub.prototype.getConnection = function () {
                return this.connection;
            };
            return Hub;
        }());
        ChatHub.Hub = Hub;
        //ハブでつながった子ども
        var Child = (function () {
            //hub:親のハブ
            //port:この子どもに送るためのMessagePort
            function Child(hub, port, closecallback) {
                this.hub = hub;
                this.port = port;
                this.closecallback = closecallback;
                this.event = getEventEmitter();
                this.requestMap = {};
            }
            //ポートを使用可能にする
            Child.prototype.init = function () {
                var _this = this;
                var port = this.port;
                port.start();
                //メッセージを受け取る
                port.addEventListener("message", function (ev) {
                    var d = ev.data;
                    _this.handleMessage(d.name, d.args, d.ackId, d.func_index_array);
                });
            };
            //サーバーのようにふるまう（初期化）
            Child.prototype.imServer = function (receiver, connection, channel) {
                var _this = this;
                //まずログをとってくる
                connection.findLog({
                    channel: channel
                }, function (logs) {
                    _this.sendEvent("init", null, [{
                            logs: logs
                        }]);
                });
                //ユーザー一覧をとってくる
                connection.getUsers(function (users) {
                    _this.sendEvent("users", null, [users]);
                });
                //現在の自分の状況をアレする
                this.sendEvent("userinfo", null, [receiver.getUserinfo()]);
            };
            //子どもから送られてきたメッセージを処理する
            Child.prototype.handleMessage = function (event, args, ackId, func_index_array) {
                var _this = this;
                if ("number" === typeof ackId && func_index_array) {
                    //ackIdが存在する(or null)・・・コールバックあり
                    //func_array:argsから抜けた関数（コールバック用）
                    for (var i = 0, l = func_index_array.length; i < l; i++) {
                        //argsに追加してあげる
                        args.splice(func_index_array[i], 0, back_handle.bind(this, ackId, i));
                    }
                    //送り返すぞ!
                    function back_handle(ackId, funcindex) {
                        var args = [];
                        for (var _i = 2; _i < arguments.length; _i++) {
                            args[_i - 2] = arguments[_i];
                        }
                        //funcindex:最初の関数が0(func_index_arrayの添字)
                        console.log("back!", ackId, funcindex, args);
                        this.send("ackresponse", {
                            ackId: ackId,
                            funcindex: funcindex,
                            args: args
                        });
                    }
                }
                //data.name:イベント名
                if (event === "unload") {
                    //実体が閉じられた（役目終了）
                    this.port.close();
                    this.hub.removeChild(this);
                    if (this.closecallback) {
                        this.closecallback.call(null);
                    }
                    return;
                }
                //子どもからハンドル要求
                if (event === "request") {
                    //event(string),requestid(number) そのイベントのID
                    var e = this.event, evname = args[0], requestid = args[1];
                    //ハンドラ登録
                    var handler = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i - 0] = arguments[_i];
                        }
                        _this.sendEvent(evname, requestid, args);
                    };
                    var connection = this.hub.getConnection();
                    connection.on(evname, handler);
                    //リクエストマップに登録（消去時用）
                    this.requestMap[requestid] = handler;
                    return;
                }
                //ハンドルしたリクエストを取り消す
                if (event === "norequest") {
                    var evname = args[0], requestid = args[1];
                    var func = this.requestMap[requestid]; //そのリスナ
                    if (func) {
                        var connection = this.hub.getConnection();
                        connection.removeListener(evname, func);
                        delete this.requestMap[requestid];
                    }
                    return;
                }
                //サーバーへ送りたい
                if (event === "message") {
                    this.hub.send.apply(this.hub, args);
                    return;
                }
            };
            //実体へメッセージ送信
            Child.prototype.send = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                this.port.postMessage({
                    name: event,
                    args: args
                });
            };
            //イベント発生を通知する
            Child.prototype.sendEvent = function (event, requestid, args) {
                this.send("handle", {
                    args: args,
                    event: event,
                    requestid: requestid
                });
            };
            return Child;
        }());
        ChatHub.Child = Child;
    })(ChatHub = Chat.ChatHub || (Chat.ChatHub = {}));
    // サーバーから情報を受け取るぞ!
    var ChatReceiver = (function () {
        //protected
        function ChatReceiver(connection, channel) {
            this.connection = connection;
            this.channel = channel;
            this.oldest_time = null; // 保有している最も古いログ
            this.active = false; //こっちから送っても大丈夫か
            this.flagMottoing = false;
            this.hub = new ChatHub.Hub(this, connection);
            this.event = getEventEmitter();
            //通信初期化
            connection.on("init", this.loginit.bind(this));
            connection.on("log", this.log.bind(this));
            connection.on("users", this.userinit.bind(this));
            connection.on("userinfo", this.userinfo.bind(this));
            connection.on("newuser", this.newuser.bind(this));
            connection.on("deluser", this.deluser.bind(this));
            connection.on("inout", this.inout.bind(this));
            //コネクション
            connection.on("disconnect", this.disconnect.bind(this));
            connection.on("reconnect", this.reconnect.bind(this));
        }
        ChatReceiver.prototype.getHub = function () {
            return this.hub;
        };
        //サーバーにmottoを要求する
        ChatReceiver.prototype.motto = function (data) {
            var _this = this;
            if (this.flagMottoing)
                return;
            this.flagMottoing = true;
            if (!data.time) {
                data.time = this.oldest_time;
            }
            var query = {
                motto: data
            };
            if (this.channel) {
                //チャネルをaddする
                query.channel = this.channel;
            }
            this.connection.send("find", query, function (logs) {
                _this.flagMottoing = false;
                if (logs.length > 0) {
                    _this.oldest_time = new Date(logs[logs.length - 1].time);
                    _this.event.emit("mottoLog", logs);
                }
            });
        };
        //ログを探す
        ChatReceiver.prototype.find = function (data, callback) {
            this.connection.send("find", data, callback);
        };
        //イベント操作用
        ChatReceiver.prototype.on = function (event, listener) {
            this.event.on(event, listener);
        };
        ChatReceiver.prototype.once = function (event, listener) {
            this.event.once(event, listener);
        };
        ChatReceiver.prototype.removeListener = function (event, listener) {
            this.event.removeListener(event, listener);
        };
        ChatReceiver.prototype.removeAllListeners = function (event) {
            this.event.removeAllListeners(event);
        };
        //準備できたら読んで・・・
        ChatReceiver.prototype.ready = function (callback) {
            if (this.active) {
                callback();
            }
            else {
                this.once("loginit", callback);
            }
        };
        //最終発言を教えてもらう
        ChatReceiver.prototype.getOldest = function () {
            return this.oldest_time;
        };
        //最初のログを送ってきた
        ChatReceiver.prototype.loginit = function (data) {
            //一番古いログをとる
            if (data.logs) {
                this.oldest_time = new Date(data.logs[data.logs.length - 1].time);
            }
            this.active = true;
            this.event.emit("loginit", data.logs);
        };
        //ログを送ってきた
        ChatReceiver.prototype.log = function (data) {
            //チャネルフィルター!!
            console.log(data);
            if (this.channel && (!Array.isArray(data.channel) || data.channel.indexOf(this.channel) < 0)) {
                // チャネルが合わない
                return;
            }
            this.event.emit("log", data);
        };
        //ユーザー一覧だ
        ChatReceiver.prototype.userinit = function (data) {
            this.event.emit("userinit", data);
        };
        //自分の情報を教えてもらう
        ChatReceiver.prototype.userinfo = function (data) {
            this.myUserinfo = data;
            this.event.emit("userinfo", data);
        };
        ChatReceiver.prototype.getUserinfo = function () {
            return this.myUserinfo || {
                name: null,
                rom: true
            };
        };
        //誰かきた
        ChatReceiver.prototype.newuser = function (data) {
            this.event.emit("newuser", data);
        };
        //いなくなった
        ChatReceiver.prototype.deluser = function (userid) {
            this.event.emit("deluser", userid);
        };
        //入退室した
        ChatReceiver.prototype.inout = function (data) {
            this.event.emit("inout", data);
        };
        //コネクション
        ChatReceiver.prototype.disconnect = function () {
            this.event.emit("disconnect");
        };
        ChatReceiver.prototype.reconnect = function () {
            this.event.emit("reconnect");
        };
        return ChatReceiver;
    }());
    Chat.ChatReceiver = ChatReceiver;
})(Chat || (Chat = {}));
