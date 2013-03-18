var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chat;
(function (Chat) {
    (function (ChatUICollection) {
        var SwitchViewForm = (function (_super) {
            __extends(SwitchViewForm, _super);
            function SwitchViewForm() {
                var _this = this;
                        _super.call(this);
                this.container = document.createElement("form");
                var p = document.createElement("p");
                this.container.appendChild(p);
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "設定";
                    input.dataset.open = "setting";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "入室者";
                    input.dataset.open = "userlist";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "その他";
                    input.dataset.open = "others";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.type = "button";
                    input.value = "戻る";
                    input.dataset.open = "";
                }));
                this.container.addEventListener("click", function (e) {
                    var t = e.target;
                    if(/^input$/i.test(t.tagName)) {
                        var tar = t.dataset.open;
                        _this.open(tar);
                    }
                }, false);
            }
            SwitchViewForm.prototype.open = function (w) {
                var inputs = this.container.getElementsByTagName("input");
                for(var i = 0, l = inputs.length; i < l; i++) {
                    var input = inputs.item(i);
                    if(w === "" && input.dataset.open === "") {
                        input.style.display = "none";
                    } else if(w !== "" && input.dataset.open !== "") {
                        input.style.display = "none";
                    } else {
                        input.style.removeProperty("display");
                    }
                }
                this.event.emit("open", w);
            };
            return SwitchViewForm;
        })(ChatUICollection.UIObject);
        ChatUICollection.SwitchViewForm = SwitchViewForm;        
    })(Chat.ChatUICollection || (Chat.ChatUICollection = {}));
    var ChatUICollection = Chat.ChatUICollection;
    var ChatSmpView = (function (_super) {
        __extends(ChatSmpView, _super);
        function ChatSmpView(userData, connection, receiver, process) {
                _super.call(this, userData, connection, receiver, process, false);
            this.switchView = new Chat.ChatUICollection.SwitchViewForm();
            this.container.insertBefore(this.switchView.getContainer(), this.container.firstChild);
            var ev = this.switchView.event;
            var elss = {
                "": [
                    this.logView.getContainer(), 
                    this.ui.getContainer(), 
                    this.motto.getContainer()
                ],
                "setting": [
                    this.settingView.getContainer()
                ],
                "userlist": [
                    this.userView.getContainer()
                ],
                "others": [
                    this.linksView.getContainer()
                ]
            };
            ev.on("open", function (w) {
                for(var key in elss) {
                    var els = elss[key];
                    els.forEach(function (el) {
                        if(key === w) {
                            el.style.removeProperty("display");
                        } else {
                            el.style.display = "none";
                        }
                    });
                }
            });
            this.switchView.open("");
        }
        return ChatSmpView;
    })(Chat.ChatView);
    Chat.ChatSmpView = ChatSmpView;    
    var SmpClientFactory = (function (_super) {
        __extends(SmpClientFactory, _super);
        function SmpClientFactory(channel, connection) {
                _super.call(this, channel, false, connection);
            this.channel = channel;
            this.connection = connection;
        }
        SmpClientFactory.prototype.makeView = function (connection, receiver, userData, process) {
            return new ChatSmpView(userData, connection, receiver, process);
        };
        return SmpClientFactory;
    })(Chat.ChatClientFactory);
    Chat.SmpClientFactory = SmpClientFactory;    
})(Chat || (Chat = {}));
