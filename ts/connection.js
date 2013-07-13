var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chat;
(function (Chat) {
    function getEventEmitter() {
        return new io.EventEmitter();
    }
    Chat.getEventEmitter = getEventEmitter;
    var ChatConnection = (function () {
        function ChatConnection() {
            this.event = getEventEmitter();
        }
        ChatConnection.prototype.initConnection = function (settings) {
            this.connection = getEventEmitter();
        };

        ChatConnection.prototype.register = function (lastid, channel, mode) {
        };

        ChatConnection.prototype.onConnection = function (func) {
            this.event.on("connect", func);
        };

        ChatConnection.prototype.findLog = function (query, callback) {
            this.send("find", query, function (arr) {
                if (!Array.isArray(arr)) {
                    callback([]);
                } else {
                    callback(arr);
                }
            });
        };

        ChatConnection.prototype.getUsers = function (callback) {
            this.send("users", function (arr) {
                callback(arr);
            });
        };

        ChatConnection.prototype.send = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
        };

        ChatConnection.prototype.emit = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this.connection.emit.apply(this.connection, [event].concat(args));
        };

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
    })();
    Chat.ChatConnection = ChatConnection;

    var SocketConnection = (function (_super) {
        __extends(SocketConnection, _super);
        function SocketConnection() {
            _super.apply(this, arguments);
        }
        SocketConnection.prototype.initConnection = function (settings) {
            var _this = this;
            this.connection = io.connect(settings.SOCKET_HOST_NAME || (location.protocol + "//" + location.host));
            this.connection.once("connect", function () {
                _this.event.emit("connect", (_this.connection).socket.sessionid);
            });
        };
        SocketConnection.prototype.register = function (lastid, channel, mode) {
            if (typeof mode === "undefined") { mode = "client"; }
            var _this = this;
            this.send("register", { "mode": mode, "lastid": lastid, channel: channel });
            this.connection.on("reconnect", function () {
                _this.send("register", { "mode": mode, "lastid": lastid, channel: channel });
            });
        };
        SocketConnection.prototype.send = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this.connection.emit.apply(this.connection, [event].concat(args));
        };
        return SocketConnection;
    })(ChatConnection);
    Chat.SocketConnection = SocketConnection;

    var ChildConnection = (function (_super) {
        __extends(ChildConnection, _super);
        function ChildConnection() {
            _super.apply(this, arguments);
            this.requestId = 0;
            this.ackId = 0;
            this.savedAck = {};
        }
        ChildConnection.prototype.initConnection = function (settings) {
            var _this = this;
            this.connection = getEventEmitter();

            window.addEventListener("message", function (ev) {
                var d = ev.data;

                if (d.name === "init") {
                    _this.port = ev.ports[0];
                    if (!_this.port) {
                        throw new Error("no port");
                    }
                    _this.initPort(_this.port);

                    _this.port.postMessage({
                        name: "ready"
                    });
                    _this.event.emit("connect", null);
                } else if (d.name === "ping") {
                    d.name = "pong";
                    ev.source.postMessage(d, ev.origin);
                }
            }, false);

            window.addEventListener("unload", function (ev) {
                _this.port.postMessage({
                    name: "unload"
                });
            }, false);
        };

        ChildConnection.prototype.push = function (event, args) {
            console.log("pushhhh", event, args);
            debugger;
            var func_number = 0, func_array = [];
            var func_index_array = [];
            for (var i = 0, l = args.length; i < l; i++) {
                if ("function" === typeof args[i]) {
                    func_array.push({
                        index: func_number + i,
                        func: args[i]
                    });

                    func_index_array.push(func_number + i);
                    args.splice(i, 1);
                    i--, l--;
                    func_number++;
                }
            }
            if (func_number > 0) {
                this.savedAck[this.ackId] = {
                    ackId: this.ackId,
                    func_number: func_number,
                    func_array: func_array
                };

                this.port.postMessage({
                    name: event,
                    args: args,
                    ackId: this.ackId,
                    func_index_array: func_index_array
                });
                this.ackId++;
            } else {
                this.port.postMessage({
                    name: event,
                    args: args
                });
            }
        };

        ChildConnection.prototype.send = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this.push("message", [event].concat(args));
        };

        ChildConnection.prototype.initPort = function (port) {
            var _this = this;
            port.start();
            port.addEventListener("message", function (ev) {
                var d = ev.data.args[0];
                if (ev.data.name === "handle") {
                    _this.connection.emit.apply(_this.connection, [d.event].concat(d.args));
                } else if (ev.data.name === "ackresponse") {
                    var obj = _this.savedAck[d.ackId];
                    console.log("back!", d, obj, _this.savedAck);
                    obj.func_array[d.funcindex].func.apply(_this, d.args);

                    delete _this.savedAck[d.ackId];
                }
            }, false);
        };

        ChildConnection.prototype.emit = function (event) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            this.connection.emit.apply(this.connection, [event].concat(args));
        };

        ChildConnection.prototype.on = function (event, listener) {
            this.requestId++;
            var id = this.requestId;

            this.push("request", [event, this.requestId]);
            this.connection.on(event, listener);
        };
        ChildConnection.prototype.once = function (event, listener) {
            this.requestId++;
            var id = this.requestId;

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
    })(ChatConnection);
    Chat.ChildConnection = ChildConnection;

    (function (ChatHub) {
        var Hub = (function () {
            function Hub(receiver, connection) {
                this.receiver = receiver;
                this.connection = connection;
                this.children = [];
            }
            Hub.prototype.makeChild = function (port, closecallback) {
                var c = new Child(this, port, closecallback);

                c.init();
                return c;
            };

            Hub.prototype.addChild = function (c) {
                this.children.push(c);
            };

            Hub.prototype.initChild = function (c, channel) {
                c.imServer(this.receiver, this.connection, channel);
            };

            Hub.prototype.removeChild = function (c) {
                this.children = this.children.filter(function (x) {
                    return x !== c;
                });
            };

            Hub.prototype.send = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                this.connection.send.apply(this.connection, args);
            };

            Hub.prototype.getConnection = function () {
                return this.connection;
            };
            return Hub;
        })();
        ChatHub.Hub = Hub;

        var Child = (function () {
            function Child(hub, port, closecallback) {
                this.hub = hub;
                this.port = port;
                this.closecallback = closecallback;
                this.event = Chat.getEventEmitter();
                this.requestMap = {};
            }
            Child.prototype.init = function () {
                var _this = this;
                var port = this.port;
                port.start();

                port.addEventListener("message", function (ev) {
                    var d = ev.data;
                    _this.handleMessage(d.name, d.args, d.ackId, d.func_index_array);
                });
            };

            Child.prototype.imServer = function (receiver, connection, channel) {
                var _this = this;
                connection.findLog({
                    channel: channel
                }, function (logs) {
                    _this.sendEvent("init", null, [
                        {
                            logs: logs
                        }
                    ]);
                });

                connection.getUsers(function (users) {
                    _this.sendEvent("users", null, [users]);
                });

                this.sendEvent("userinfo", null, [receiver.getUserinfo()]);
            };

            Child.prototype.handleMessage = function (event, args, ackId, func_index_array) {
                var _this = this;
                if ("number" === typeof ackId && func_index_array) {
                    for (var i = 0, l = func_index_array.length; i < l; i++) {
                        args.splice(func_index_array[i], 0, back_handle.bind(this, ackId, i));
                    }

                    function back_handle(ackId, funcindex) {
                        var args = [];
                        for (var _i = 0; _i < (arguments.length - 2); _i++) {
                            args[_i] = arguments[_i + 2];
                        }
                        console.log("back!", ackId, funcindex, args);
                        this.send("ackresponse", {
                            ackId: ackId,
                            funcindex: funcindex,
                            args: args
                        });
                    }
                }

                if (event === "unload") {
                    this.port.close();
                    this.hub.removeChild(this);
                    if (this.closecallback) {
                        this.closecallback.call(null);
                    }
                    return;
                }

                if (event === "request") {
                    var e = this.event, evname = args[0], requestid = args[1];

                    var handler = function () {
                        var args = [];
                        for (var _i = 0; _i < (arguments.length - 0); _i++) {
                            args[_i] = arguments[_i + 0];
                        }
                        _this.sendEvent(evname, requestid, args);
                    };
                    var connection = this.hub.getConnection();
                    connection.on(evname, handler);

                    this.requestMap[requestid] = handler;
                    return;
                }

                if (event === "norequest") {
                    var evname = args[0], requestid = args[1];
                    var func = this.requestMap[requestid];
                    if (func) {
                        var connection = this.hub.getConnection();
                        connection.removeListener(evname, func);
                        delete this.requestMap[requestid];
                    }
                    return;
                }

                if (event === "message") {
                    this.hub.send.apply(this.hub, args);
                    return;
                }
            };

            Child.prototype.send = function (event) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    args[_i] = arguments[_i + 1];
                }
                this.port.postMessage({
                    name: event,
                    args: args
                });
            };

            Child.prototype.sendEvent = function (event, requestid, args) {
                this.send("handle", {
                    args: args,
                    event: event,
                    requestid: requestid
                });
            };
            return Child;
        })();
        ChatHub.Child = Child;
    })(Chat.ChatHub || (Chat.ChatHub = {}));
    var ChatHub = Chat.ChatHub;

    var ChatReceiver = (function () {
        function ChatReceiver(connection, channel) {
            this.connection = connection;
            this.channel = channel;
            this.oldest_time = null;
            this.active = false;
            this.flagMottoing = false;
            this.hub = new ChatHub.Hub(this, connection);
            this.event = getEventEmitter();

            connection.on("init", this.loginit.bind(this));
            connection.on("log", this.log.bind(this));
            connection.on("users", this.userinit.bind(this));
            connection.on("userinfo", this.userinfo.bind(this));
            connection.on("newuser", this.newuser.bind(this));
            connection.on("deluser", this.deluser.bind(this));
            connection.on("inout", this.inout.bind(this));

            connection.on("disconnect", this.disconnect.bind(this));
            connection.on("reconnect", this.reconnect.bind(this));
        }
        ChatReceiver.prototype.getHub = function () {
            return this.hub;
        };

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

        ChatReceiver.prototype.find = function (data, callback) {
            this.connection.send("find", data, callback);
        };

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

        ChatReceiver.prototype.ready = function (callback) {
            if (this.active) {
                callback();
            } else {
                this.once("loginit", callback);
            }
        };

        ChatReceiver.prototype.getOldest = function () {
            return this.oldest_time;
        };

        ChatReceiver.prototype.loginit = function (data) {
            if (data.logs) {
                this.oldest_time = new Date(data.logs[data.logs.length - 1].time);
            }
            this.active = true;
            this.event.emit("loginit", data.logs);
        };

        ChatReceiver.prototype.log = function (data) {
            console.log(data);
            if (this.channel && (!Array.isArray(data.channel) || data.channel.indexOf(this.channel) < 0)) {
                return;
            }
            this.event.emit("log", data);
        };

        ChatReceiver.prototype.userinit = function (data) {
            this.event.emit("userinit", data);
        };

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

        ChatReceiver.prototype.newuser = function (data) {
            this.event.emit("newuser", data);
        };

        ChatReceiver.prototype.deluser = function (userid) {
            this.event.emit("deluser", userid);
        };

        ChatReceiver.prototype.inout = function (data) {
            this.event.emit("inout", data);
        };

        ChatReceiver.prototype.disconnect = function () {
            this.event.emit("disconnect");
        };
        ChatReceiver.prototype.reconnect = function () {
            this.event.emit("reconnect");
        };
        return ChatReceiver;
    })();
    Chat.ChatReceiver = ChatReceiver;
})(Chat || (Chat = {}));
