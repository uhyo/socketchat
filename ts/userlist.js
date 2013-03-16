var Chat;
(function (Chat) {
    var UserListFactory = (function () {
        function UserListFactory() {
        }
        UserListFactory.prototype.getUserList = function (callback) {
            var userData = this.makeUserData();
            var connection = this.makeConnection(userData);
            var receiver = this.makeReceiver(connection);
            var view = this.makeView(connection, receiver, userData);
            if(callback) {
                callback(new UserList(userData, connection, receiver, view));
            }
        };
        UserListFactory.prototype.makeUserData = function () {
            var ud = new Chat.ChatUserData();
            ud.load();
            return ud;
        };
        UserListFactory.prototype.makeConnection = function (userData) {
            var connection = new Chat.SocketConnection();
            connection.initConnection(settings);
            connection.register(null, null, "userlist");
            return connection;
        };
        UserListFactory.prototype.makeReceiver = function (connection) {
            return new Chat.ChatReceiver(connection, null);
        };
        UserListFactory.prototype.makeView = function (connection, receiver, userData) {
            return new UserListView(userData, connection, receiver);
        };
        return UserListFactory;
    })();
    Chat.UserListFactory = UserListFactory;    
    var UserList = (function () {
        function UserList(userData, connection, receiver, view) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.view = view;
        }
        return UserList;
    })();
    Chat.UserList = UserList;    
    var UserListView = (function () {
        function UserListView(userData, connection, receiver) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.container = document.createElement("div");
            document.body.appendChild(this.container);
            this.container.appendChild((function (h1) {
                h1.textContent = "UserList";
                return h1;
            })(document.createElement("h1")));
            this.table = document.createElement("table");
            this.initTable(this.table);
            this.container.appendChild(this.table);
            receiver.on("userinit", this.userinit.bind(this));
            receiver.on("newuser", this.newuser.bind(this));
            receiver.on("deluser", this.deluser.bind(this));
            receiver.on("inout", this.inout.bind(this));
        }
        UserListView.prototype.initTable = function (table) {
            var thead = table.createTHead();
            [
                "名前", 
                "IPアドレス", 
                "UA"
            ].forEach(function (x) {
                var th = document.createElement("th");
                th.textContent = x;
                thead.appendChild(th);
            });
        };
        UserListView.prototype.userinit = function (data) {
            data.users.forEach(this.newuser, this);
        };
        UserListView.prototype.newuser = function (user) {
            var tr = this.table.insertRow();
            tr.style.color = this.getColorByIP(user.ip);
            tr.dataset.id = String(user.id);
            [
                "(ROM)", 
                user.ip, 
                user.ua
            ].forEach(function (x) {
                var td = tr.insertCell(-1);
                td.textContent = x;
            });
            if(!user.rom) {
                this.inout(user);
            }
        };
        UserListView.prototype.deluser = function (userid) {
            var tr = this.getElement(userid);
            if(tr) {
                this.table.deleteRow(tr.rowIndex);
            }
        };
        UserListView.prototype.inout = function (user) {
            var tr = this.getElement(user.id);
            if(tr) {
                var td = tr.cells[0];
                if(user.rom) {
                    td.textContent = "(ROM)";
                } else {
                    td.textContent = user.name;
                }
            }
        };
        UserListView.prototype.getElement = function (userid) {
            var rows = this.table.rows;
            for(var i = 0, l = rows.length; i < l; i++) {
                if((rows[i]).dataset.id === String(userid)) {
                    return rows[i];
                }
            }
            return null;
        };
        UserListView.prototype.getColorByIP = function (ip) {
            var arr = ip.split(/\./);
            return "rgb(" + Math.floor(parseInt(arr[0]) * 0.75) + "," + Math.floor(parseInt(arr[1]) * 0.75) + "," + Math.floor(parseInt(arr[2]) * 0.75) + ")";
        };
        return UserListView;
    })();
    Chat.UserListView = UserListView;    
})(Chat || (Chat = {}));
