var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path="client.ts"/>
var Chat;
(function (Chat) {
    //userList
    var LogViewerFactory = (function (_super) {
        __extends(LogViewerFactory, _super);
        function LogViewerFactory() {
            return _super.call(this, null, false, null) || this;
        }
        LogViewerFactory.prototype.getLogViewer = function (callback) {
            var userData = this.makeUserData();
            var connection = this.makeConnection(userData);
            var receiver = this.makeReceiver(connection);
            var view = this.makeView(connection, receiver, userData);
            if (callback) {
                callback(new LogViewer(userData, connection, receiver, view));
            }
        };
        LogViewerFactory.prototype.makeConnection = function (userData) {
            var connection = new Chat.SocketConnection;
            connection.initConnection(settings);
            connection.register(null, null, "chalog");
            return connection;
        };
        LogViewerFactory.prototype.makeReceiver = function (connection) {
            return new FindReceiver(connection);
        };
        LogViewerFactory.prototype.makeView = function (connection, receiver, userData) {
            return new LogViewerView(userData, connection, receiver);
        };
        LogViewerFactory.prototype.makeAPI = function (connection, receiver, userData, process, view) {
            return null;
        };
        return LogViewerFactory;
    }(Chat.ChatClientFactory));
    Chat.LogViewerFactory = LogViewerFactory;
    var LogViewer = (function () {
        function LogViewer(userData, connection, receiver, view) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.view = view;
        }
        return LogViewer;
    }());
    Chat.LogViewer = LogViewer;
    //ビュー
    var LogViewerView = (function (_super) {
        __extends(LogViewerView, _super);
        function LogViewerView(userData, connection, receiver) {
            return _super.call(this, userData, connection, receiver, null, false, null) || this;
        }
        LogViewerView.prototype.initView = function (userData, connection, receiver, process, com) {
            var _this = this;
            this.container = document.createElement("div");
            //bodyへ
            document.body.appendChild(this.container);
            this.container.appendChild((function (h1) {
                h1.textContent = "Chalog Viewer";
                return h1;
            })(document.createElement("h1")));
            //
            this.qf = new FindQueryForm();
            this.container.appendChild(this.qf.getContainer());
            //クエリが発行されたら・・・?
            this.qf.onQuery(function (query) {
                _this.connection.send("query", query);
            });
            //ログ表示部分
            this.logFlow = new Chat.ChatLogFlow(userData, receiver);
            this.container.appendChild(this.logFlow.getContainer());
            this.logFlow.refreshSettings();
            //チャネルをクリックしたら?
            this.logFlow.event.on("focusChannel", function (channel) {
                //チャットを開く
                var a = document.createElement("a");
                a.href = "/#" + channel;
                a.target = "_blank";
                a.click();
            });
        };
        return LogViewerView;
    }(Chat.ChatView));
    Chat.LogViewerView = LogViewerView;
    //検索条件フォーム
    var FindQueryForm = (function (_super) {
        __extends(FindQueryForm, _super);
        function FindQueryForm() {
            var _this = _super.call(this) || this;
            //private event:EventEmitter;
            //private container:HTMLFormElement;
            _this.query = null; //現在のクエリ
            _this.container = document.createElement("form");
            _this.container.appendChild(_this.makeRangePart());
            _this.container.appendChild(_this.makeQueryPart());
            _this.container.appendChild(_this.makeOperatePart());
            _this.container.addEventListener("submit", function (e) {
                var form = e.target;
                e.preventDefault();
                //クエリつくる
                var query = {};
                query.value = Number(formValue("page_number"));
                query.page = 0;
                var range = getRadioValue(form, "range");
                if (range === "time") {
                    //時間
                    var of = (new Date).getTimezoneOffset() * 60000; //ミリ秒
                    query.starttime = new Date((new Date(formValue("starttime"))).getTime() + of);
                    query.endtime = new Date((new Date(formValue("endtime"))).getTime() + of);
                }
                if (formChecked("use_name_or_ip")) {
                    var noi = getRadioValue(form, "name_or_ip");
                    if (noi === "name") {
                        //名前
                        query.name = formValue("name_or_ip_value");
                    }
                    else if (noi === "ip") {
                        query.ip = formValue("name_or_ip_value");
                    }
                }
                if (formChecked("use_comment")) {
                    query.comment = formValue("comment_value");
                }
                if (formChecked("use_channel")) {
                    query.channel = formValue("channel_value");
                }
                //現在のクエリとして保存
                _this.query = query;
                //クエリ発行
                _this.event.emit("query", query);
                function formValue(name) {
                    return form.elements[name].value;
                }
                function formChecked(name) {
                    return form.elements[name].checked;
                }
            }, false);
            return _this;
        }
        //ページ移動してクエリ発行
        FindQueryForm.prototype.movePage = function (inc) {
            if (!this.query)
                return;
            if (!this.query.page)
                this.query.page = 0;
            this.query.page += inc;
            if (this.query.page < 0)
                this.query.page = 0;
            this.event.emit("query", this.query);
        };
        FindQueryForm.prototype.onQuery = function (callback) {
            this.event.on("query", callback);
        };
        FindQueryForm.prototype.makeRangePart = function () {
            var fs = document.createElement("fieldset");
            fs.appendChild(Chat.makeEl("legend", function (el) {
                el.textContent = "取得範囲";
            }));
            fs.appendChild(Chat.makeEl("p", function (p) {
                p.appendChild(Chat.makeEl("label", function (label) {
                    label.appendChild(Chat.makeEl("input", function (el) {
                        var input = el;
                        input.type = "radio";
                        input.name = "range";
                        input.value = "time";
                    }));
                    label.appendChild(document.createTextNode("発言時間で検索:"));
                }));
                var now = (new Date).toISOString();
                now = now.replace(/(?:Z|[-+]\d\d(?::?\d\d)?)$/, "");
                //ミリ秒は取り除く
                if (/^.+?T\d\d:\d\d:\d\d[\.,]\d+$/.test(now)) {
                    now = now.replace(/[\.,]\d+$/, "");
                }
                p.appendChild(Chat.makeEl("label", function (label) {
                    label.textContent = "始点時間";
                    label.appendChild(Chat.makeEl("input", function (el) {
                        var input = el;
                        input.type = "datetime-local";
                        input.name = "starttime";
                        input.value = now;
                        input.step = "1";
                    }));
                }));
                p.appendChild(Chat.makeEl("label", function (label) {
                    label.textContent = " 終点時間";
                    label.appendChild(Chat.makeEl("input", function (el) {
                        var input = el;
                        input.type = "datetime-local";
                        input.name = "endtime";
                        input.value = now;
                        input.step = "1";
                    }));
                }));
            }));
            fs.appendChild(Chat.makeEl("p", function (p) {
                p.appendChild(Chat.makeEl("label", function (label) {
                    label.appendChild(Chat.makeEl("input", function (el) {
                        var input = el;
                        input.type = "radio";
                        input.name = "range";
                        input.value = "new";
                        input.checked = true;
                    }));
                    label.appendChild(document.createTextNode("新しいほうから検索"));
                }));
            }));
            //変更されたらラジオボックスを入れたりする処理
            fs.addEventListener("change", function (e) {
                //先取りinput
                var inp = e.target;
                if (!/^input$/i.test(inp.tagName))
                    return; //違う
                if (inp.type === "radio")
                    return; //チェックボックス自身は気にしない
                //ラジオボックスを探す
                var radio = document.evaluate('ancestor-or-self::p/descendant::input[@type="radio"]', inp, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
                if (radio) {
                    radio.checked = true;
                }
            }, false);
            return fs;
        };
        FindQueryForm.prototype.makeQueryPart = function () {
            return Chat.makeEl("fieldset", function (fs) {
                fs.appendChild(Chat.makeEl("legend", function (legend) {
                    legend.textContent = "検索条件";
                }));
                fs.appendChild(Chat.makeEl("p", function (p) {
                    p.appendChild(makeInput(function (input) {
                        input.type = "checkbox";
                        input.name = "use_name_or_ip";
                    }));
                    p.appendChild(makeInputAndLabel("名前", true, function (input) {
                        input.type = "radio";
                        input.name = "name_or_ip";
                        input.value = "name";
                        input.checked = true;
                    }));
                    p.appendChild(document.createTextNode("or"));
                    p.appendChild(makeInputAndLabel("IPアドレス", true, function (input) {
                        input.type = "radio";
                        input.name = "name_or_ip";
                        input.value = "ip";
                    }));
                    p.appendChild(document.createTextNode("で検索:"));
                    p.appendChild(makeInput(function (input) {
                        input.type = "text";
                        input.name = "name_or_ip_value";
                        input.size = 25;
                    }));
                }));
                fs.appendChild(Chat.makeEl("p", function (p) {
                    p.appendChild(makeInputAndLabel("コメントで検索:", true, function (input) {
                        input.type = "checkbox";
                        input.name = "use_comment";
                    }));
                    p.appendChild(makeInput(function (input) {
                        input.type = "text";
                        input.name = "comment_value";
                        input.size = 60;
                    }));
                }));
                fs.appendChild(Chat.makeEl("p", function (p) {
                    p.appendChild(makeInputAndLabel("ハッシュタグで検索:", true, function (input) {
                        input.type = "checkbox";
                        input.name = "use_channel";
                    }));
                    p.appendChild(makeInputAndLabel("#", false, function (input) {
                        input.type = "text";
                        input.name = "channel_value";
                        input.size = 25;
                    }));
                }));
                //変更されたらチェックボックスを入れたりする処理
                fs.addEventListener("change", function (e) {
                    //先取りinput
                    var inp = e.target;
                    if (!/^input$/i.test(inp.tagName))
                        return; //違う
                    if (inp.type === "checkbox")
                        return; //チェックボックス自身は気にしない
                    //チェックボックスを探す
                    var checkbox = document.evaluate('ancestor-or-self::p/descendant::input[@type="checkbox"]', inp, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
                    if (checkbox) {
                        checkbox.checked = inp.value !== "";
                    }
                }, false);
            });
        };
        FindQueryForm.prototype.makeOperatePart = function () {
            var _this = this;
            return Chat.makeEl("fieldset", function (fs) {
                fs.appendChild(Chat.makeEl("legend", function (legend) {
                    legend.textContent = "検索";
                }));
                fs.appendChild(Chat.makeEl("p", function (p) {
                    p.appendChild(makeInput(function (input) {
                        input.type = "submit";
                        input.value = "検索";
                    }));
                    p.appendChild(document.createTextNode(": 1ページに"));
                    p.appendChild(makeInput(function (input) {
                        input.type = "number";
                        input.min = "100";
                        input.max = "500";
                        input.step = "100";
                        input.name = "page_number";
                        input.value = "100";
                    }));
                    p.appendChild(document.createTextNode("発言表示"));
                }));
                fs.appendChild(Chat.makeEl("p", function (p) {
                    p.appendChild(makeInput(function (input) {
                        input.type = "button";
                        input.value = "前のページ";
                        input.addEventListener("click", function (e) {
                            _this.movePage(-1);
                        }, false);
                    }));
                    p.appendChild(Chat.makeEl("output", function (el) {
                        var output = el;
                        output.name = "thispage";
                        output.value = "";
                        //イベント
                        _this.event.on("query", function (q) {
                            output.value = q.page + "ページ目";
                        });
                    }));
                    p.appendChild(makeInput(function (input) {
                        input.type = "button";
                        input.value = "次のページ";
                        input.addEventListener("click", function (e) {
                            _this.movePage(1);
                        }, false);
                    }));
                }));
            });
        };
        return FindQueryForm;
    }(Chat.ChatUICollection.UIObject));
    Chat.FindQueryForm = FindQueryForm;
    //拡張Receiver（resultをうけとれる）
    var FindReceiver = (function (_super) {
        __extends(FindReceiver, _super);
        //private event:EventEmitter;
        function FindReceiver(connection) {
            var _this = _super.call(this, connection, null) || this;
            //追加
            connection.on("result", _this.result.bind(_this));
            return _this;
        }
        FindReceiver.prototype.result = function (data) {
            //ログを初期化する感じで!
            this.event.emit("loginit", data.logs);
        };
        return FindReceiver;
    }(Chat.ChatReceiver));
    Chat.FindReceiver = FindReceiver;
    function makeInput(callback) {
        return Chat.makeEl("input", function (el) { return callback(el); });
    }
    function makeInputAndLabel(text, follow, callback) {
        return Chat.makeEl("label", function (label) {
            if (follow) {
                label.appendChild(makeInput(callback));
                label.appendChild(document.createTextNode(text));
            }
            else {
                label.appendChild(document.createTextNode(text));
                label.appendChild(makeInput(callback));
            }
        });
    }
    function getRadioValue(form, name) {
        var t = form.elements[name];
        if (t && t.length && t.item) {
            for (var i = 0, l = t.length; i < l; i++) {
                if (t[i].checked)
                    return t[i].value;
            }
        }
        else if (t) {
            return t.checked ? t.value : null;
        }
        return null;
    }
})(Chat || (Chat = {}));
