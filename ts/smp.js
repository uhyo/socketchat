var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="client.ts"/>
var Chat;
(function (Chat) {
    var ChatUICollection;
    (function (ChatUICollection) {
        var SwitchViewForm = (function (_super) {
            __extends(SwitchViewForm, _super);
            //public event:EventEmitter;
            //private container:HTMLFormElement;
            function SwitchViewForm() {
                var _this = this;
                _super.call(this);
                this.container = document.createElement("form");
                //フォーム開閉ボタン
                var p = document.createElement("p");
                this.container.appendChild(p);
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "設定";
                    input.dataset["open"] = "setting";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "入室者";
                    input.dataset["open"] = "userlist";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "その他";
                    input.dataset["open"] = "others";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "戻る";
                    input.dataset["open"] = "";
                }));
                this.container.addEventListener("click", function (e) {
                    var t = e.target;
                    if (/^input$/i.test(t.tagName)) {
                        var tar = t.dataset["open"];
                        _this.open(tar);
                    }
                }, false);
            }
            SwitchViewForm.prototype.open = function (w) {
                //表示を切り替える
                var inputs = this.container.getElementsByTagName("input");
                for (var i = 0, l = inputs.length; i < l; i++) {
                    var input = inputs.item(i);
                    if (w === "" && input.dataset["open"] === "") {
                        //戻るボタンはいらない
                        input.style.display = "none";
                    }
                    else if (w !== "" && input.dataset["open"] !== "") {
                        //戻る以外はいらない
                        input.style.display = "none";
                    }
                    else {
                        //表示
                        input.style.removeProperty("display");
                    }
                }
                this.event.emit("open", w);
            };
            return SwitchViewForm;
        }(ChatUICollection.UIObject));
        ChatUICollection.SwitchViewForm = SwitchViewForm;
    })(ChatUICollection = Chat.ChatUICollection || (Chat.ChatUICollection = {}));
    var ChatSmpView = (function (_super) {
        __extends(ChatSmpView, _super);
        function ChatSmpView(userData, connection, receiver, process) {
            _super.call(this, userData, connection, receiver, process, false, null);
            //切り替えボタンをつくる
            this.switchView = new ChatUICollection.SwitchViewForm();
            this.container.insertBefore(this.switchView.getContainer(), this.container.firstChild);
            var ev = this.switchView.event;
            //イベントに対応する
            var elss = {
                "": [this.logView.getContainer(), this.ui.getContainer(), this.motto.getContainer()],
                "setting": [this.settingView.getContainer()],
                "userlist": [this.userView.getContainer()],
                "others": [this.linksView.getContainer()]
            };
            ev.on("open", function (w) {
                for (var key in elss) {
                    var els = elss[key];
                    els.forEach(function (el) {
                        if (key === w) {
                            //これを表示
                            el.style.removeProperty("display");
                        }
                        else {
                            //非表示
                            el.style.display = "none";
                        }
                    });
                }
            });
            //初期化
            this.switchView.open("");
        }
        return ChatSmpView;
    }(Chat.ChatView));
    Chat.ChatSmpView = ChatSmpView;
    var SmpClientFactory = (function (_super) {
        __extends(SmpClientFactory, _super);
        function SmpClientFactory(channel, connection) {
            _super.call(this, channel, false, connection);
        }
        SmpClientFactory.prototype.makeView = function (connection, receiver, userData, process) {
            return new ChatSmpView(userData, connection, receiver, process);
        };
        return SmpClientFactory;
    }(Chat.ChatClientFactory));
    Chat.SmpClientFactory = SmpClientFactory;
})(Chat || (Chat = {}));
