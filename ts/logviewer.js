var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chat;
(function (Chat) {
    var LogViewerFactory = (function (_super) {
        __extends(LogViewerFactory, _super);
        function LogViewerFactory() {
            _super.call(this, null, false, null);
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
            var connection = new Chat.SocketConnection();
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
    })(Chat.ChatClientFactory);
    Chat.LogViewerFactory = LogViewerFactory;
    var LogViewer = (function () {
        function LogViewer(userData, connection, receiver, view) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.view = view;
        }
        return LogViewer;
    })();
    Chat.LogViewer = LogViewer;

    var LogViewerView = (function (_super) {
        __extends(LogViewerView, _super);
        function LogViewerView(userData, connection, receiver) {
            _super.call(this, userData, connection, receiver, null, false);
        }
        LogViewerView.prototype.initView = function (userData, connection, receiver, process, com) {
            var _this = this;
            this.container = document.createElement("div");

            document.body.appendChild(this.container);
            this.container.appendChild((function (h1) {
                h1.textContent = "Chalog Viewer";
                return h1;
            })(document.createElement("h1")));

            this.qf = new FindQueryForm();
            this.container.appendChild(this.qf.getContainer());

            this.qf.onQuery(function (query) {
                _this.connection.send("query", query);
            });

            this.logFlow = new Chat.ChatLogFlow(userData, receiver);
            this.container.appendChild(this.logFlow.getContainer());
            this.logFlow.refreshSettings();

            this.logFlow.event.on("focusChannel", function (channel) {
                var a = document.createElement("a");
                a.href = "/#" + channel;
                a.target = "_blank";
                a.click();
            });
        };
        return LogViewerView;
    })(Chat.ChatView);
    Chat.LogViewerView = LogViewerView;

    var FindQueryForm = (function (_super) {
        __extends(FindQueryForm, _super);
        function FindQueryForm() {
            var _this = this;
            _super.call(this);
            this.query = null;
            this.container = document.createElement("form");
            this.container.appendChild(this.makeRangePart());
            this.container.appendChild(this.makeQueryPart());
            this.container.appendChild(this.makeOperatePart());
            this.container.addEventListener("submit", function (e) {
                var form = e.target;
                e.preventDefault();

                var query = {};
                query.value = Number(formValue("page_number"));
                query.page = 0;
                var range = getRadioValue(form, "range");
                if (range === "time") {
                    var of = (new Date()).getTimezoneOffset() * 60000;
                    query.starttime = new Date((new Date(formValue("starttime"))).getTime() + of);
                    query.endtime = new Date((new Date(formValue("endtime"))).getTime() + of);
                }
                if (formChecked("use_name_or_ip")) {
                    var noi = getRadioValue(form, "name_or_ip");
                    if (noi === "name") {
                        query.name = formValue("name_or_ip_value");
                    } else if (noi === "ip") {
                        query.ip = formValue("name_or_ip_value");
                    }
                }
                if (formChecked("use_comment")) {
                    query.comment = formValue("comment_value");
                }
                if (formChecked("use_channel")) {
                    query.channel = formValue("channel_value");
                }

                _this.query = query;

                _this.event.emit("query", query);

                function formValue(name) {
                    return (form.elements[name]).value;
                }
                function formChecked(name) {
                    return (form.elements[name]).checked;
                }
            }, false);
        }
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
                var now = (new Date()).toISOString();
                now = now.replace(/(?:Z|[-+]\d\d(?::?\d\d)?)$/, "");

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

                fs.addEventListener("change", function (e) {
                    var inp = e.target;
                    if (!/^input$/i.test(inp.tagName))
                        return;
                    if (inp.type === "checkbox")
                        return;

                    var checkbox = (document).evaluate('ancestor-or-self::p/descendant::input[@type="checkbox"]', inp, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
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
    })(Chat.ChatUICollection.UIObject);
    Chat.FindQueryForm = FindQueryForm;

    var FindReceiver = (function (_super) {
        __extends(FindReceiver, _super);
        function FindReceiver(connection) {
            _super.call(this, connection, null);

            connection.on("result", this.result.bind(this));
        }
        FindReceiver.prototype.result = function (data) {
            this.event.emit("loginit", data.logs);
        };
        return FindReceiver;
    })(Chat.ChatReceiver);
    Chat.FindReceiver = FindReceiver;

    function makeInput(callback) {
        return Chat.makeEl("input", function (el) {
            return callback(el);
        });
    }
    function makeInputAndLabel(text, follow, callback) {
        return Chat.makeEl("label", function (label) {
            if (follow) {
                label.appendChild(makeInput(callback));
                label.appendChild(document.createTextNode(text));
            } else {
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
        } else if (t) {
            return t.checked ? t.value : null;
        }
        return null;
    }
})(Chat || (Chat = {}));
