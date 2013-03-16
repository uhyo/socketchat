var Chat;
(function (Chat) {
    var ChatClient = (function () {
        function ChatClient(userData, connection, receiver, process, view, channel) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
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
            this.child = !!sessionStorage.getItem("independent_flag");
        }
        ChatClientFactory.prototype.getChat = function (callback) {
            var _this = this;
            var userData = this.makeUserData();
            var connection = this.makeConnection(userData);
            connection.onConnection(function (sessionid) {
                if(sessionid) {
                    userData.lastid = sessionid;
                    userData.save();
                }
                var receiver = _this.makeReceiver(connection);
                var process = _this.makeProcess(connection, receiver, userData);
                var view = _this.makeView(connection, receiver, userData, process);
                var chat = new ChatClient(userData, connection, receiver, process, view, _this.channel);
                if(callback) {
                    callback(chat);
                }
            });
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
        return ChatClientFactory;
    })();
    Chat.ChatClientFactory = ChatClientFactory;    
})(Chat || (Chat = {}));
