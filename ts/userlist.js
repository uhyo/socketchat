var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chat;
(function (Chat) {
    var UserListFactory = (function (_super) {
        __extends(UserListFactory, _super);
        function UserListFactory() {
            _super.call(this, null, false, null);
        }
        UserListFactory.prototype.makeConnection = function (userData) {
            var connection = new Chat.SocketConnection();
            connection.initConnection(settings);
            connection.register(null, null, "userlist");
            return connection;
        };
        UserListFactory.prototype.makeReceiver = function (connection) {
            return new Chat.ChatReceiver(connection, null);
        };
        UserListFactory.prototype.makeView = function (connection, receiver, userData, process) {
            return new UserListView(userData, connection, receiver);
        };
        UserListFactory.prototype.makeAPI = function (connection, receiver, userData, process, view) {
            return null;
        };
        return UserListFactory;
    })(Chat.ChatClientFactory);
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

    var UserListView = (function (_super) {
        __extends(UserListView, _super);
        function UserListView(userData, connection, receiver) {
            _super.call(this, userData, connection, receiver, null, false);
        }
        UserListView.prototype.initView = function (userData, connection, receiver, process, com) {
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
        };
        UserListView.prototype.initTable = function (table) {
            var thead = table.createTHead();
            ["名前", "IPアドレス", "UA"].forEach(function (x) {
                var th = document.createElement("th");
                th.textContent = x;
                thead.appendChild(th);
            });
        };
        UserListView.prototype.userinit = function (data) {
            data.users.forEach(this.newuser, this);
        };
        UserListView.prototype.newuser = function (user) {
            var tr = this.table.insertRow(-1);
            tr.style.color = this.getColorByIP(user.ip);
            tr.dataset.id = String(user.id);
            ["(ROM)", user.ip, user.ua].forEach(function (x) {
                var td = tr.insertCell(-1);
                td.textContent = x;
            });
            if (!user.rom) {
                this.inout(user);
            }
        };

        UserListView.prototype.deluser = function (userid) {
            var tr = this.getElement(userid);
            if (tr) {
                this.table.deleteRow(tr.rowIndex);
            }
        };

        UserListView.prototype.inout = function (user) {
            var tr = this.getElement(user.id);
            if (tr) {
                var td = tr.cells[0];
                if (user.rom) {
                    td.textContent = "(ROM)";
                } else {
                    td.textContent = user.name;
                }
            }
        };

        UserListView.prototype.getElement = function (userid) {
            var rows = this.table.rows;
            for (var i = 0, l = rows.length; i < l; i++) {
                if ((rows[i]).dataset.id === String(userid)) {
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
    })(Chat.ChatView);
    Chat.UserListView = UserListView;
})(Chat || (Chat = {}));
