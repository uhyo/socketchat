var Chat;
(function (Chat) {
    var ChatClient = (function () {
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
    })();
    Chat.ChatClient = ChatClient;    
    var ChatClientFactory = (function () {
        function ChatClientFactory(channel, com, connection) {
            this.channel = channel;
            this.com = com;
            this.connection = connection;
            var _this = this;
            this.domReady = false;
            this.child = !!sessionStorage.getItem("independent_flag");
            document.addEventListener("DOMContentLoaded", function (e) {
                _this.domReady = true;
            }, false);
        }
        ChatClientFactory.prototype.getChat = function (callback) {
            var _this = this;
            if(this.chat) {
                if(callback) {
                    callback(this.chat);
                }
                return;
            }
            var userData = this.makeUserData();
            var listener = function (e) {
                var connection = _this.makeConnection(userData);
                connection.onConnection(function (sessionid) {
                    if(sessionid) {
                        userData.lastid = sessionid;
                        userData.save();
                    }
                    var receiver = _this.makeReceiver(connection);
                    var process = _this.makeProcess(connection, receiver, userData);
                    var view = _this.makeView(connection, receiver, userData, process);
                    var api = _this.makeAPI(connection, receiver, userData, process, view);
                    var chat = new ChatClient(userData, connection, receiver, process, view, api, _this.channel);
                    _this.chat = chat;
                    if(callback) {
                        callback(chat);
                    }
                });
            };
            if(this.domReady) {
                listener(null);
            } else {
                document.addEventListener("DOMContentLoaded", listener, false);
            }
        };
        ChatClientFactory.prototype.makeUserData = function () {
            var ud = new Chat.ChatUserData();
            ud.load();
            return ud;
        };
        ChatClientFactory.prototype.makeConnection = function (userData) {
            var connection;
            if(this.child) {
                connection = new Chat.ChildConnection();
            } else if(this.connection === "socket") {
                connection = new Chat.SocketConnection();
            } else {
                connection = new Chat.ChatConnection();
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
        ChatClientFactory.prototype.makeView = function (connection, receiver, userData, process) {
            return new Chat.ChatView(userData, connection, receiver, process, this.com);
        };
        ChatClientFactory.prototype.makeAPI = function (connection, receiver, userData, process, view) {
            return new ChatClientAPI(userData, connection, receiver, process, view);
        };
        return ChatClientFactory;
    })();
    Chat.ChatClientFactory = ChatClientFactory;    
    var ChatClientAPI = (function () {
        function ChatClientAPI(userData, connection, receiver, process, view) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.acceptedEvents = [
                "log", 
                "userinfo", 
                "newuser", 
                "deluser", 
                "init"
            ];
        }
        ChatClientAPI.prototype.on = function (event, listener) {
            if(this.acceptedEvents.indexOf(event) === -1) {
                return;
            }
            this.receiver.on(event, listener);
        };
        ChatClientAPI.prototype.once = function (event, listener) {
            if(this.acceptedEvents.indexOf(event) === -1) {
                return;
            }
            this.receiver.once(event, listener);
        };
        ChatClientAPI.prototype.removeListener = function (event, listener) {
            if(this.acceptedEvents.indexOf(event) === -1) {
                return;
            }
            this.receiver.removeListener(event, listener);
        };
        ChatClientAPI.prototype.inout = function (name) {
            var data = {
                name: name
            };
            this.process.inout(data);
        };
        ChatClientAPI.prototype.say = function (comment, response, channel) {
            if(!channel) {
                channel = null;
            } else if("string" === typeof channel) {
                channel = [
                    channel
                ];
            } else if(!Array.isArray(channel)) {
                throw null;
            }
            var data = {
                comment: comment,
                response: response,
                channel: channel
            };
            this.process.comment(data);
        };
        return ChatClientAPI;
    })();
    Chat.ChatClientAPI = ChatClientAPI;    
})(Chat || (Chat = {}));
