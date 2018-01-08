"use strict";
/// <reference path="definition.ts"/>
/// <reference path="connection.ts"/>
/// <reference path="process.ts"/>
/// <reference path="view.ts"/>
var Chat;
(function (Chat) {
    //枠的な?
    var ChatClient = /** @class */ (function () {
        function ChatClient(userData, connection, receiver, process, view, api, channel) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.api = api;
            this.channel = channel;
        }
        return ChatClient;
    }());
    Chat.ChatClient = ChatClient;
    //Factory
    var ChatClientFactory = /** @class */ (function () {
        //protected
        function ChatClientFactory(channel, com, connection) {
            var _this = this;
            this.channel = channel;
            this.com = com;
            this.connection = connection;
            this.domReady = false;
            //子かどうかの判定入れる
            this.child = !!sessionStorage.getItem("independent_flag");
            //ready?
            document.addEventListener("DOMContentLoaded", function (e) {
                _this.domReady = true;
            }, false);
        }
        ChatClientFactory.prototype.getChat = function (callback) {
            var _this = this;
            if (this.chat) {
                //既にチャットを作ったならそれをあげる
                if (callback) {
                    callback(this.chat);
                }
                return;
            }
            //userData取得
            var userData = this.makeUserData();
            var listener = function (e) {
                //connection作る
                var connection = _this.makeConnection(userData);
                connection.onConnection(function (sessionid) {
                    //reg
                    if (sessionid) {
                        userData.lastid = sessionid;
                        userData.save();
                    }
                    //receiver
                    var receiver = _this.makeReceiver(connection);
                    //process作る
                    var process = _this.makeProcess(connection, receiver, userData);
                    //view
                    var view = _this.makeView(connection, receiver, userData, process, _this.channel);
                    //api
                    var api = _this.makeAPI(connection, receiver, userData, process, view);
                    //作る
                    var chat = new ChatClient(userData, connection, receiver, process, view, api, _this.channel);
                    _this.chat = chat;
                    if (callback) {
                        callback(chat);
                    }
                });
            };
            if (this.domReady) {
                listener(null);
            }
            else {
                document.addEventListener("DOMContentLoaded", listener, false);
            }
        };
        ChatClientFactory.prototype.makeUserData = function () {
            var ud = new Chat.ChatUserData;
            ud.load();
            return ud;
        };
        ChatClientFactory.prototype.makeConnection = function (userData) {
            var connection;
            if (this.child) {
                connection = new Chat.ChildConnection;
            }
            else if (this.connection === "socket") {
                connection = new Chat.SocketConnection;
            }
            else {
                connection = new Chat.ChatConnection; //実体ないよ！
            }
            connection.initConnection(settings);
            connection.register(userData.lastid, this.channel);
            return connection;
        };
        ChatClientFactory.prototype.makeReceiver = function (connection) {
            return new Chat.ChatReceiver(connection, this.channel);
        };
        ChatClientFactory.prototype.makeProcess = function (connection, receiver, userData) {
            return new Chat.ChatProcess(connection, receiver, userData, this.channel);
        };
        ChatClientFactory.prototype.makeView = function (connection, receiver, userData, process, channel) {
            return new Chat.ChatView(userData, connection, receiver, process, this.com, this.channel);
        };
        ChatClientFactory.prototype.makeAPI = function (connection, receiver, userData, process, view) {
            return new ChatClientAPI(userData, connection, receiver, process, view);
        };
        return ChatClientFactory;
    }());
    Chat.ChatClientFactory = ChatClientFactory;
    //API
    var ChatClientAPI = /** @class */ (function () {
        function ChatClientAPI(userData, connection, receiver, process, view) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.acceptedEvents = ["log", "userinfo", "newuser", "deluser", "init"];
        }
        //イベント操作用
        ChatClientAPI.prototype.on = function (event, listener) {
            if (this.acceptedEvents.indexOf(event) === -1)
                return;
            this.receiver.on(event, listener);
        };
        ChatClientAPI.prototype.once = function (event, listener) {
            if (this.acceptedEvents.indexOf(event) === -1)
                return;
            this.receiver.once(event, listener);
        };
        ChatClientAPI.prototype.removeListener = function (event, listener) {
            if (this.acceptedEvents.indexOf(event) === -1)
                return;
            this.receiver.removeListener(event, listener);
        };
        //入退室
        ChatClientAPI.prototype.inout = function (name) {
            var data = {
                name: name,
            };
            this.process.inout(data);
        };
        //発言
        ChatClientAPI.prototype.say = function (comment, response, channel) {
            if (!channel)
                channel = null;
            else if ("string" === typeof channel) {
                channel = [channel];
            }
            else if (!Array.isArray(channel)) {
                throw null;
            }
            var data = {
                comment: comment,
                response: response,
                channel: channel,
            };
            this.process.comment(data);
        };
        return ChatClientAPI;
    }());
    Chat.ChatClientAPI = ChatClientAPI;
})(Chat || (Chat = {}));
