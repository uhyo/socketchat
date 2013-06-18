var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Chat;
(function (Chat) {
    var ChatView = (function () {
        function ChatView(userData, connection, receiver, process, com) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.process = process;
            this.initView(userData, connection, receiver, process, com);
        }
        ChatView.prototype.initView = function (userData, connection, receiver, process, com) {
            this.container = document.createElement("div");
            document.body.setAttribute('role', 'application');
            document.body.appendChild(this.container);
            this.dis = new ChatLogDisManager(userData);
            if(com) {
                this.linksView = null;
                this.settingView = null;
            } else {
                this.linksView = new ChatLinksView();
                this.settingView = new ChatSettingView(userData, this);
            }
            this.logView = new ChatLogView(userData, receiver, process, this, this.dis);
            this.userView = new ChatUserView(receiver, this, this.dis);
            if(com) {
                this.ui = new ChatCmdUI(userData, receiver, process, this, this.dis);
            } else {
                this.ui = new ChatNormalUI(userData, receiver, process, this, this.dis);
            }
            this.motto = new ChatUICollection.MottoForm();
            this.motto.onMotto(function (data) {
                receiver.motto(data);
            });
            if(this.linksView) {
                this.container.appendChild(this.linksView.getContainer());
            }
            if(this.settingView) {
                this.container.appendChild(this.settingView.getContainer());
            }
            this.container.appendChild(this.ui.getContainer());
            this.container.appendChild(this.logView.getContainer());
            this.container.appendChild(this.userView.getContainer());
            this.container.appendChild(this.motto.getContainer());
            receiver.on("disconnect", function () {
                document.body.classList.add("discon");
            });
            receiver.on("reconnect", function () {
                document.body.classList.remove("discon");
            });
            window.addEventListener("scroll", function (e) {
                var st = document.body.scrollTop || document.documentElement.scrollTop || 0;
                var cl = document.documentElement.offsetHeight;
                var i = window.innerHeight;
                if(st >= cl - i) {
                    receiver.motto({
                    });
                }
            }, false);
        };
        ChatView.prototype.refreshSettings = function () {
            this.settingView.refreshSettings();
            this.logView.refreshSettings();
            this.ui.refreshSettings();
        };
        ChatView.prototype.focusComment = function (focus, channel) {
            this.ui.focusComment(focus, channel);
        };
        ChatView.prototype.showSiyou = function () {
            alert("\
・「餃子無展開」「餃子常時」「餃子オンマウス」ボタン\n\
　gyazo.comでアップロードされた画像のサムネイル表示設定\n\
\n\
・「欄#」「窓#」ボタン\n\
　発言欄に「#○○」でタグが付く\n\
　タグのリンクをクリックで専用ウィンドウ開いたり自動補完したりする\n\
\n\
・[s], [small], [code]について\n\
　[s]取り消し線[/s]\n\
　[small]文字サイズ小さく[/small]\n\
　[code]等幅フォント+改行無し[/code]\n\
　いずれも閉じ省略可能でその場合は発言の最後まで適用\n\
\n\
・発言クリックで右に出る矢印について\n\
　緑クリックで下に枠が出るのでそこに入力して発言すると返信になる\n\
　灰色クリックで矢印を消す\n\
");
        };
        ChatView.prototype.getContainer = function () {
            return this.container;
        };
        return ChatView;
    })();
    Chat.ChatView = ChatView;    
    var ChatLinksView = (function () {
        function ChatLinksView() {
            this.links = [
                [
                    {
                        url: "http://shogitter.com/",
                        name: "将棋"
                    }, 
                    {
                        url: "http://81.la/shogiwiki/",
                        name: "wiki"
                    }, 
                    {
                        url: "http://81.la/cgi-bin/up/",
                        name: "up"
                    }, 
                    
                ], 
                [
                    {
                        url: "/list",
                        name: "list"
                    }, 
                    {
                        url: "/log",
                        name: "log"
                    }, 
                    {
                        url: "/apiclient",
                        name: "API"
                    }, 
                    {
                        url: "/com",
                        name: "com"
                    }, 
                    
                ], 
                
            ];
            this.container = document.createElement("div");
            this.container.classList.add("links");
            this.container.appendChild(this.makeLinks());
        }
        ChatLinksView.prototype.getContainer = function () {
            return this.container;
        };
        ChatLinksView.prototype.makeLinks = function () {
            var df = document.createDocumentFragment();
            for(var i = 0, l = this.links.length; i < l; i++) {
                var ls = this.links[i];
                var ul = document.createElement("ul");
                for(var j = 0, m = ls.length; j < m; j++) {
                    var o = ls[j];
                    var a = document.createElement("a");
                    a.href = o.url;
                    a.target = "_blank";
                    a.textContent = o.name;
                    ul.appendChild(makeEl("li", function (li) {
                        li.appendChild(a);
                    }));
                }
                df.appendChild(ul);
            }
            return df;
        };
        return ChatLinksView;
    })();
    Chat.ChatLinksView = ChatLinksView;    
    var ChatSettingView = (function () {
        function ChatSettingView(userData, view) {
            this.userData = userData;
            this.view = view;
            this.gyozaSettings = [
                "餃子無展開", 
                "餃子オンマウス", 
                "餃子常時"
            ];
            this.channelSettings = [
                "欄#", 
                "窓#"
            ];
            this.container = document.createElement("form");
            this.container.classList.add("infobar");
            this.container.appendChild(this.makeGyozaButton());
            this.container.appendChild(this.makeVolumeRange());
            this.container.appendChild(this.makeChannelModeButton());
            this.container.appendChild(this.makeSiyouButton());
        }
        ChatSettingView.prototype.makeGyozaButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "gyozabutton";
            button.type = "button";
            button.value = this.gyozaSettings[ud.gyoza];
            button.addEventListener("click", function (e) {
                ud.gyoza = (ud.gyoza + 1) % _this.gyozaSettings.length;
                ud.save();
                _this.view.refreshSettings();
            }, false);
            return button;
        };
        ChatSettingView.prototype.makeVolumeRange = function () {
            var df = document.createDocumentFragment();
            var range = document.createElement("input");
            var ud = this.userData;
            range.name = "volume";
            range.type = "range";
            range.min = "0" , range.max = "100" , range.step = "10";
            range.value = String(ud.volume);
            var timerid = null;
            range.addEventListener("change", function (e) {
                ud.volume = Number(range.value);
                clearTimeout(timerid);
                timerid = setTimeout(function () {
                    ud.save();
                }, 1000);
            }, false);
            df.appendChild(range);
            return df;
        };
        ChatSettingView.prototype.makeChannelModeButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "channelmode";
            button.type = "button";
            button.value = this.channelSettings[ud.channelMode];
            button.addEventListener("click", function (e) {
                ud.channelMode = (ud.channelMode + 1) % _this.channelSettings.length;
                button.value = _this.channelSettings[ud.channelMode];
                ud.save();
            }, false);
            return button;
        };
        ChatSettingView.prototype.makeSiyouButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "siyou";
            button.type = "button";
            button.value = "仕様";
            button.addEventListener("click", function (e) {
                _this.view.showSiyou();
            }, false);
            return button;
        };
        ChatSettingView.prototype.getContainer = function () {
            return this.container;
        };
        ChatSettingView.prototype.refreshSettings = function () {
            var form = this.container, ud = this.userData;
            var gyozabutton = form.elements["gyozabutton"];
            gyozabutton.value = this.gyozaSettings[ud.gyoza];
            var volumeRange = form.elements["volume"];
            volumeRange.value = String(ud.volume);
            var channelbutton = form.elements["channelmode"];
            channelbutton.value = this.channelSettings[ud.channelMode];
        };
        return ChatSettingView;
    })();
    Chat.ChatSettingView = ChatSettingView;    
    var ChatLogView = (function () {
        function ChatLogView(userData, receiver, process, view, dis) {
            this.userData = userData;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.dis = dis;
            var _this = this;
            this.container = document.createElement("div");
            this.flow = new ChatLogFlow(userData, receiver);
            dis.registerLogContainer(this.flow.getContainer());
            this.container.appendChild(this.flow.getContainer());
            this.refreshSettings();
            this.audio = this.getAudio("/sound");
            var fe = this.flow.event;
            fe.on("logaudio", function () {
                _this.audio.volume = _this.userData.volume / 100;
                _this.audio.play();
            });
            fe.on("focusChannel", function (channel) {
                if(userData.channelMode === 0) {
                    var focusedChannel = _this.dis.setFocusChannel(channel);
                    _this.view.focusComment(false, focusedChannel);
                } else {
                    _this.dis.addDischannel(channel, true, false);
                    _this.process.openChannel(channel, function () {
                        _this.dis.removeDischannel(channel, true, false);
                    });
                }
            });
            fe.on("openReplyForm", function (log) {
                if(log.classList.contains("replyready")) {
                    return;
                }
                var comForm = new ChatUICollection.CommentForm(receiver, true);
                var cont = comForm.getContainer();
                var p = cont.getElementsByTagName("p")[0];
                if(p) {
                    p.insertBefore(makeEl("span", function (el) {
                        el.className = "icon respin opened";
                        el.textContent = "\ue000";
                    }), p.firstChild);
                }
                log.parentNode.insertBefore(cont, log.nextSibling);
                log.classList.add("replyready");
                comForm.event.on("comment", function (data) {
                    data.response = log.dataset.id;
                    _this.process.comment(data);
                    appearAnimation(cont, "vertical", false, true);
                    log.classList.remove("replyready");
                });
                comForm.event.on("cancel", function () {
                    appearAnimation(cont, "vertical", false, true);
                    log.classList.remove("replyready");
                });
                appearAnimation(cont, "vertical", true, true);
                var ch = log.dataset.channel || "";
                var result = ch.match(/^#([^#]+)\/(?:#|$)/);
                console.log(result);
                if(result) {
                    comForm.setChannel(result[1]);
                } else {
                    comForm.setChannel(null);
                }
                comForm.focus();
            });
        }
        ChatLogView.prototype.getContainer = function () {
            return this.container;
        };
        ChatLogView.prototype.refreshSettings = function () {
            this.flow.refreshSettings();
        };
        ChatLogView.prototype.getAudio = function (filename) {
            var audio;
            try  {
                audio = new Audio();
                audio.removeAttribute("src");
                [
                    "ogg", 
                    "mp3", 
                    "wav"
                ].forEach(function (ext) {
                    var source = document.createElement("source");
                    source.src = filename + "." + ext;
                    source.type = "audio/" + ext;
                    audio.appendChild(source);
                });
            } catch (e) {
                audio = {
                    play: function () {
                    }
                };
            }
            return audio;
        };
        return ChatLogView;
    })();
    Chat.ChatLogView = ChatLogView;    
    var ChatLogFlow = (function () {
        function ChatLogFlow(userData, receiver) {
            this.userData = userData;
            this.receiver = receiver;
            var _this = this;
            this.event = Chat.getEventEmitter();
            this.container = document.createElement("div");
            this.container.setAttribute('role', 'log');
            this.container.classList.add("logbox");
            setUniqueId(this.container, "log");
            this.lineMaker = new ChatLineMaker(userData);
            receiver.on("loginit", function (logs) {
                var range = document.createRange();
                range.selectNodeContents(_this.container);
                range.deleteContents();
                range.detach();
                logs.reverse().forEach(function (log) {
                    _this.getLog(log, true);
                });
            });
            receiver.on("log", function (log) {
                _this.getLog(log, false);
            });
            receiver.on("mottoLog", function (logs) {
                logs.forEach(function (log) {
                    var line = _this.lineMaker.make(log);
                    _this.container.appendChild(line);
                });
            });
            this.gyozaOnmouseListener = (function (e) {
                var t = e.target;
                if(!t.classList.contains("gyoza")) {
                    return;
                }
                if(t.classList.contains("gyozaloaded")) {
                    return;
                }
                _this.lineMaker.checkGyoza(t);
            }).bind(this);
            this.container.addEventListener("click", this.clickHandler.bind(this), false);
            this.toolbox = this.makeToolbox();
            var clistener = function (e) {
                var selection = window.getSelection();
                var box = [];
                for(var i = 0, l = selection.rangeCount; i < l; i++) {
                    var range = selection.getRangeAt(i);
                    var an = range.commonAncestorContainer;
                    var tw = document.createTreeWalker(an, NodeFilter.SHOW_ELEMENT, function (node) {
                        if(node.classList.contains("icon")) {
                            return NodeFilter.FILTER_ACCEPT;
                        } else {
                            return NodeFilter.FILTER_SKIP;
                        }
                    }, false);
                    tw.currentNode = range.startContainer;
                    var node;
                    var range2;
                    while(node = tw.nextNode()) {
                        if(!range2) {
                            range2 = document.createRange();
                        }
                        range2.selectNode(node);
                        if(range.compareBoundaryPoints(Range.START_TO_END, range2) <= 0) {
                            break;
                        }
                        tw.currentNode = node.parentNode;
                        var df = range2.extractContents();
                        box.push({
                            range: range2,
                            df: df
                        });
                        console.log(df);
                        range2 = null;
                    }
                }
                setTimeout(function () {
                    box.reverse();
                    box.forEach(function (obj) {
                        obj.range.insertNode(obj.df);
                        obj.range.detach();
                    });
                }, 0);
            };
            this.container.addEventListener("copy", clistener, false);
        }
        ChatLogFlow.prototype.getContainer = function () {
            return this.container;
        };
        ChatLogFlow.prototype.getLog = function (obj, initmode) {
            var line = this.lineMaker.make(obj);
            this.container.insertBefore(line, this.container.firstChild);
            if(!initmode && this.userData.volume > 0) {
                var style = (document.defaultView).getComputedStyle(line, null);
                if(style.display !== "none") {
                    this.event.emit("logaudio");
                }
            }
        };
        ChatLogFlow.prototype.refreshSettings = function () {
            this.container.removeEventListener("mouseover", this.gyozaOnmouseListener, false);
            if(this.userData.gyoza === 1) {
                this.container.addEventListener("mouseover", this.gyozaOnmouseListener, false);
            }
        };
        ChatLogFlow.prototype.clickHandler = function (e) {
            var _this = this;
            var t = e.target;
            var cl = t.classList;
            if(cl.contains("channel") && t.dataset.channel) {
                this.event.emit("focusChannel", t.dataset.channel);
            } else if(cl.contains("respin")) {
                if(cl.contains("opened")) {
                    var bq = (document).evaluate('ancestor::p/following-sibling::blockquote', t, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    appearAnimation(bq, "vertical", false, true);
                } else if(!cl.contains("processing")) {
                    var log = t.parentNode.parentNode;
                    this.receiver.find({
                        id: log.dataset.respto
                    }, function (logs) {
                        if(logs.length > 0) {
                            var l = logs[0];
                            var line = _this.lineMaker.make(l);
                            var bq = document.createElement("blockquote");
                            bq.classList.add("resp");
                            bq.appendChild(line);
                            log.parentNode.insertBefore(bq, log.nextSibling);
                            appearAnimation(bq, "vertical", true, true, function () {
                                cl.remove("processing");
                            });
                        }
                    });
                    cl.add("processing");
                }
                cl.toggle("opened");
                return;
            }
            var logp = (document).evaluate('ancestor-or-self::p', t, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
            if(logp && logp.classList.contains("log")) {
                if(this.selectedLog !== logp) {
                    this.selectedLog = logp;
                    logp.appendChild(this.toolbox);
                    appearAnimation(this.toolbox, "fade", true, true);
                }
            } else {
                if(this.toolbox.parentNode) {
                    appearAnimation(this.toolbox, "fade", false, true);
                }
                this.selectedLog = null;
            }
        };
        ChatLogFlow.prototype.makeToolbox = function () {
            var _this = this;
            var toolbox = document.createElement("span");
            toolbox.classList.add("toolbox");
            toolbox.appendChild(makeEl("span", function (el) {
                el.className = "icon resptip";
                el.setAttribute("role", "button");
                el.textContent = "\ue001";
                el.addEventListener("click", function (e) {
                    var log = _this.selectedLog;
                    if(log) {
                        _this.event.emit("openReplyForm", log);
                    }
                }, false);
            }));
            toolbox.appendChild(makeEl("span", function (el) {
                el.className = "icon hidetoolbox";
                el.setAttribute("role", "button");
                el.textContent = "\ue004";
                el.addEventListener("click", function (e) {
                    appearAnimation(toolbox, "fade", false, true, function () {
                        _this.selectedLog = null;
                    });
                }, false);
            }));
            return toolbox;
        };
        return ChatLogFlow;
    })();
    Chat.ChatLogFlow = ChatLogFlow;    
    var ChatLogDisManager = (function () {
        function ChatLogDisManager(userData) {
            this.userData = userData;
            var _this = this;
            this.focusedChannel = null;
            this.disip = [];
            this.logContainer = null;
            userData.disip.forEach(function (ip) {
                _this.setDisipStyle(ip);
            });
            userData.dischannel.forEach(function (channel) {
                _this.setDischannelStyle(channel, false, false);
            });
        }
        ChatLogDisManager.prototype.registerLogContainer = function (c) {
            this.logContainer = c;
        };
        ChatLogDisManager.prototype.addDisip = function (ip, temporal) {
            if (typeof temporal === "undefined") { temporal = false; }
            var ud = this.userData;
            if(ud.disip.indexOf(ip) >= 0) {
                return false;
            }
            if(!temporal) {
                ud.disip.push(ip);
                ud.save();
            }
            this.setDisipStyle(ip);
            return true;
        };
        ChatLogDisManager.prototype.setDisipStyle = function (ip) {
            this.addCSSRules([
                '.logbox > p.log[data-ip="' + ip + '"]{display:none}', 
                '.users li[data-ip="' + ip + '"]{text-decoration:line-through}', 
                
            ]);
        };
        ChatLogDisManager.prototype.removeDisip = function (ip, temporal) {
            var ud = this.userData;
            if(!temporal) {
                ud.disip = ud.disip.filter(function (x) {
                    x !== ip;
                });
                ud.save();
            }
            this.removeCSSRules([
                '.logbox > p.log[data-ip="' + ip + '"]', 
                '.users li[data-ip="' + ip + '"]', 
                
            ]);
        };
        ChatLogDisManager.prototype.setFocusChannel = function (channel) {
            var lastChannel = this.focusedChannel;
            if(lastChannel === channel) {
                channel = null;
            }
            this.focusedChannel = channel;
            if(lastChannel !== null) {
                this.removeDischannel(lastChannel, true, true);
            }
            if(channel !== null) {
                this.addDischannel(channel, true, true);
            }
            return channel;
        };
        ChatLogDisManager.prototype.createDisCSSSelector = function (attribute, temporal, anti) {
            if(anti) {
                attribute = ":not(" + attribute + ")";
            }
            return "#" + this.logContainer.id + " > p.log" + attribute;
        };
        ChatLogDisManager.prototype.createDisCSSRule = function (attribute, temporal, anti) {
            var selector = this.createDisCSSSelector(attribute, temporal, anti);
            var body = temporal ? "opacity:0.3;" : "display:none;";
            return selector + "{" + body + "}";
        };
        ChatLogDisManager.prototype.addCSSRules = function (cssTexts) {
            if(document.styleSheets.length === 0) {
                var style = document.createElement("style");
                document.head.appendChild(style);
            }
            cssTexts.forEach(function (cssText) {
                (document.styleSheets.item(0)).insertRule(cssText, 0);
            });
        };
        ChatLogDisManager.prototype.removeCSSRules = function (cssSelectors) {
            var css = document.styleSheets.item(0);
            for(var i = css.cssRules.length - 1; i >= 0; i--) {
                var rule = css.cssRules[i];
                if(cssSelectors.indexOf(rule.selectorText) >= 0) {
                    css.deleteRule(i);
                }
            }
        };
        ChatLogDisManager.prototype.addDischannel = function (channel, temporal, anti) {
            var ud = this.userData;
            if(ud.dischannel.indexOf(channel) >= 0) {
                return false;
            }
            if(!temporal) {
                ud.dischannel.push(channel);
                ud.save();
            }
            this.setDischannelStyle(channel, temporal, anti);
            return true;
        };
        ChatLogDisManager.prototype.setDischannelStyle = function (channel, temporal, anti) {
            this.addCSSRules([
                this.createDisCSSRule('[data-channel*="#' + channel + '/"]', temporal, anti), 
                
            ]);
        };
        ChatLogDisManager.prototype.removeDischannel = function (channel, temporal, anti) {
            var ud = this.userData;
            if(!temporal) {
                ud.dischannel = ud.dischannel.filter(function (x) {
                    return x !== channel;
                });
                ud.save();
            }
            this.removeCSSRules([
                this.createDisCSSSelector('[data-channel*="#' + channel + '/"]', temporal, anti), 
                
            ]);
        };
        ChatLogDisManager.prototype.addFocusOutlaw = function (temporal) {
            this.addCSSRules([
                this.createDisCSSRule('[data-channel]', temporal, false), 
                
            ]);
        };
        ChatLogDisManager.prototype.removeFocusOutlaw = function (temporal) {
            this.removeCSSRules([
                this.createDisCSSSelector('[data-channel]', temporal, false), 
                
            ]);
        };
        return ChatLogDisManager;
    })();
    Chat.ChatLogDisManager = ChatLogDisManager;    
    var ChatLineMaker = (function () {
        function ChatLineMaker(userData) {
            this.userData = userData;
            this.gyazoSetting = [
                {
                    thumb: true,
                    url: {
                        image: "http://gyazo.com/",
                        thumb: "http://gyazo.com/thumb/",
                        ext: true
                    },
                    text: {
                        normal: "[Gyazo]",
                        opening: "[Gyoza…]",
                        error: "[Gyoza?]"
                    }
                }, 
                {
                    thumb: false,
                    url: {
                        image: "http://myazo.net/",
                        thumb: "http://myazo.net/s/",
                        ext: true
                    },
                    text: {
                        normal: "[Myazo]",
                        opening: "[Myoza…]",
                        error: "[Myoza?]"
                    }
                }, 
                {
                    thumb: true,
                    url: {
                        image: "http://g.81.la/",
                        thumb: "http://g.81.la/thumbnail.php?id=",
                        ext: false
                    },
                    text: {
                        normal: "[81g]",
                        opening: "[81kg…]",
                        error: "[81kg?]"
                    }
                }
            ];
        }
        ChatLineMaker.prototype.make = function (obj) {
            var p = document.createElement("p");
            p.classList.add("log");
            if(obj.syslog) {
                p.classList.add("syslog");
            }
            var color = this.getColorByIP(obj.ip);
            var name = el("bdi", obj.name);
            name.classList.add("name");
            name.style.color = color;
            p.appendChild(name);
            p.appendChild(makeEl("span", function (span) {
                span.classList.add("nameseparator");
                span.style.color = color;
                span.textContent = "> ";
            }));
            var main = document.createElement("span");
            main.classList.add("main");
            if(obj.response) {
                var resptip = document.createElement("span");
                resptip.className = "icon respin";
                resptip.textContent = "\ue000";
                main.appendChild(resptip);
            }
            var comment = document.createElement("bdi");
            comment.appendChild(this.commentHTMLify(obj.commentObject || obj.comment));
            this.parse(comment, obj);
            comment.normalize();
            main.appendChild(comment);
            if(obj.channel) {
                p.dataset.channel = "#" + (Array.isArray(obj.channel) ? obj.channel.join("/#") : obj.channel) + "/";
                var c = Array.isArray(obj.channel) ? obj.channel : [
                    obj.channel
                ];
                var sps = comment.getElementsByClassName("channels");
                var chhs = Array.prototype.map.call(sps, function (x) {
                    return x.textContent;
                });
                for(var i = 0, l = c.length; i < l; i++) {
                    if(chhs.indexOf("#" + c[i]) === -1) {
                        main.appendChild(this.makeChannelSpan(c[i]));
                    }
                }
            }
            if(obj.response) {
                p.dataset.respto = obj.response;
                p.classList.add("respto");
            }
            var info = document.createElement("span");
            info.classList.add("info");
            var date = new Date(obj.time);
            var datestring = date.getFullYear() + "-" + zero2(date.getMonth() + 1) + "-" + zero2(date.getDate());
            var timestring = zero2(date.getHours()) + ":" + zero2(date.getMinutes()) + ":" + zero2(date.getSeconds());
            var time = document.createElement("time");
            var dateelement = el("span", datestring);
            dateelement.classList.add("date");
            var timeelement = el("span", " " + timestring);
            timeelement.classList.add("time");
            time.appendChild(dateelement);
            time.appendChild(timeelement);
            time.appendChild(document.createTextNode("; "));
            time.dateTime = datestring + "T" + timestring;
            info.appendChild(time);
            p.dataset.id = obj._id;
            p.dataset.ip = obj.ip;
            var ipstring = obj.ip + (obj.ipff ? " (forwarded for: " + obj.ipff + ")" : "");
            var ipelement = el("span", ipstring + ";");
            ipelement.classList.add("ip");
            info.appendChild(ipelement);
            name.title = datestring + " " + timestring + ", " + ipstring;
            main.appendChild(info);
            main.style.color = color;
            p.appendChild(main);
            return p;
            function el(name, content) {
                var result = document.createElement(name);
                result.textContent = content;
                return result;
            }
            function zero2(num) {
                return ("00" + num).slice(-2);
            }
        };
        ChatLineMaker.prototype.getColorByIP = function (ip) {
            if("string" === typeof ip) {
                var arr = ip.split(/\./);
                return "rgb(" + Math.floor(parseInt(arr[0]) * 0.75) + "," + Math.floor(parseInt(arr[1]) * 0.75) + "," + Math.floor(parseInt(arr[2]) * 0.75) + ")";
            } else {
                return "black";
            }
        };
        ChatLineMaker.prototype.commentHTMLify = function (comment) {
            var _this = this;
            if("string" === typeof comment) {
                return document.createTextNode(comment);
            } else if(Array.isArray(comment)) {
                var df = document.createDocumentFragment();
                comment.forEach(function (x) {
                    df.appendChild(_this.commentHTMLify(x));
                });
                return df;
            } else {
                var elm = document.createElement(comment.name);
                for(var i in comment.attributes) {
                    elm.setAttribute(i, comment.attributes[i]);
                }
                for(var i in comment.style) {
                    elm.style.setProperty(i, comment.style[i], null);
                }
                elm.appendChild(this.commentHTMLify(comment.child));
                return elm;
            }
        };
        ChatLineMaker.prototype.makeChannelSpan = function (channel) {
            var span = document.createElement("span");
            span.className = "channels";
            var wholeChannel = "";
            var channels = channel.split("/");
            for(var i = 0, l = channels.length; i < l; i++) {
                span.appendChild((function (i, ch) {
                    var span = document.createElement("span");
                    span.className = "channel";
                    if(i === 0) {
                        wholeChannel = ch;
                        span.textContent = "#" + ch;
                    } else {
                        wholeChannel += "/" + ch;
                        span.textContent = "/" + ch;
                    }
                    span.dataset.channel = wholeChannel;
                    return span;
                })(i, channels[i]));
            }
            return span;
        };
        ChatLineMaker.prototype.parse = function (rawnode, obj) {
            var _this = this;
            var allowed_tag = [
                "s", 
                "small", 
                "code"
            ];
            if(rawnode.nodeType === Node.TEXT_NODE) {
                var node = rawnode;
                if(!node.parentNode) {
                    return;
                }
                while(node.nodeValue) {
                    var res = node.nodeValue.match(/^\[(\w+?)\]/);
                    if(res) {
                        if(allowed_tag.indexOf(res[1]) < 0) {
                            node = node.splitText(res[0].length);
                            continue;
                        }
                        var span = document.createElement("span");
                        span.classList.add(res[1]);
                        span.textContent = node.nodeValue.slice(res[0].length);
                        if(!span.textContent) {
                            node = node.splitText(res[0].length);
                            continue;
                        }
                        node.parentNode.replaceChild(span, node);
                        node = span.firstChild;
                        continue;
                    }
                    res = node.nodeValue.match(/^\[\/(\w+?)\]/);
                    if(res) {
                        if(allowed_tag.indexOf(res[1]) < 0) {
                            node = node.splitText(res[0].length);
                        }
                        var p = node;
                        while(p = p.parentNode) {
                            var cl = (p).classList;
                            if(cl && cl.contains(res[1])) {
                                break;
                            }
                        }
                        if(p) {
                            node.nodeValue = node.nodeValue.slice(res[0].length);
                            p.parentNode.insertBefore(node, p.nextSibling);
                        } else {
                            node = node.splitText(res[0].length);
                        }
                        continue;
                    }
                    res = node.nodeValue.match(/^https?:\/\/\S+/);
                    if(res) {
                        var matched = false;
                        for(var i = 0, l = this.gyazoSetting.length; i < l; i++) {
                            var settingObj = this.gyazoSetting[i];
                            var res2 = res[0].match(new RegExp("^" + settingObj.url.image.replace(".", "\\.") + "([0-9a-f]{32})(?:\\.png)?"));
                            if(!res2) {
                                continue;
                            }
                            var a = document.createElement("a");
                            a.target = "_blank";
                            a.href = settingObj.url.image + res2[1] + (settingObj.url.ext ? ".png" : "");
                            a.classList.add("gyoza");
                            if(settingObj.thumb && this.userData.gyoza === 2) {
                                this.openGyoza(settingObj, a, res2[1]);
                            } else {
                                a.textContent = settingObj.text.normal;
                            }
                            node = node.splitText(res2[0].length);
                            node.parentNode.replaceChild(a, node.previousSibling);
                            matched = true;
                            break;
                        }
                        if(matched) {
                            continue;
                        }
                        var a = document.createElement("a");
                        a.href = res[0];
                        a.target = "_blank";
                        try  {
                            a.textContent = decodeURIComponent(res[0]);
                        } catch (e) {
                            a.textContent = res[0];
                        }
                        node = node.splitText(res[0].length);
                        node.parentNode.replaceChild(a, node.previousSibling);
                        continue;
                    }
                    res = node.nodeValue.match(/^(\s*)#(\S+)/);
                    if(res) {
                        if(res[1]) {
                            node = node.splitText(res[1].length);
                        }
                        var chs = Array.isArray(obj.channel) ? obj.channel.concat([]) : [];
                        var i = chs.length;
                        if(i > 0) {
                            chs.sort(function (a, b) {
                                return a.length - b.length;
                            });
                        }
                        while(i--) {
                            var c = chs[i];
                            if(res[2].slice(0, c.length) === c) {
                                var span = this.makeChannelSpan(c);
                                node = node.splitText(c.length + 1);
                                node.parentNode.replaceChild(span, node.previousSibling);
                                node = node.splitText(res[2].length - c.length);
                                break;
                            }
                        }
                        if(i < 0) {
                            node = node.splitText(res[2].length + 1);
                        }
                        continue;
                    }
                    res = node.nodeValue.match(/^(.+?)(?=\[\/?\w+?\]|https?:\/\/|\s+#\S+)/);
                    if(res) {
                        node = node.splitText(res[0].length);
                        continue;
                    }
                    node = node.splitText(node.nodeValue.length);
                }
            } else if(rawnode.childNodes) {
                var nodes = [];
                for(var i = 0, l = rawnode.childNodes.length; i < l; i++) {
                    nodes.push(rawnode.childNodes[i]);
                }
                nodes.forEach(function (x) {
                    if(x.parentNode === rawnode) {
                        _this.parse(x, obj);
                    }
                });
            }
        };
        ChatLineMaker.prototype.openGyoza = function (settingObj, a, imageid) {
            while(a.hasChildNodes()) {
                a.removeChild(a.firstChild);
            }
            var text = document.createTextNode(settingObj.text.opening);
            a.appendChild(text);
            var img = document.createElement("img");
            img.classList.add("thumbnail");
            img.hidden = true;
            a.appendChild(img);
            img.addEventListener("load", function (e) {
                a.removeChild(text);
                img.hidden = false;
            }, false);
            img.addEventListener("error", function (e) {
                text.data = settingObj.text.error;
                a.removeChild(img);
            }, false);
            img.src = settingObj.url.thumb + imageid + ".png";
            img.alt = settingObj.url.image + imageid + ".png";
            a.classList.add("gyozaloaded");
        };
        ChatLineMaker.prototype.checkGyoza = function (a) {
            for(var i = 0, l = this.gyazoSetting.length; i < l; i++) {
                var settingObj = this.gyazoSetting[i];
                if(!settingObj.thumb) {
                    continue;
                }
                var result = a.href.match(new RegExp("^" + settingObj.url.image.replace(".", "\\.") + "([0-9a-f]{32})(?:\\.png)?$"));
                if(result) {
                    this.openGyoza(settingObj, a, result[1]);
                }
            }
        };
        return ChatLineMaker;
    })();
    Chat.ChatLineMaker = ChatLineMaker;    
    var ChatUserView = (function () {
        function ChatUserView(receiver, view, dis) {
            this.receiver = receiver;
            this.view = view;
            this.dis = dis;
            this.container = document.createElement("div");
            this.container.classList.add("userinfo");
            this.userNumber = document.createElement("div");
            this.userNumber.classList.add("usernumber");
            this.userNumber.dataset.roms = "0";
            this.userNumber.dataset.actives = "0";
            this.container.appendChild(this.userNumber);
            this.userList = document.createElement("ul");
            this.userList.classList.add("users");
            this.container.appendChild(this.userList);
            this.userList.addEventListener("click", this.clickHandler.bind(this), false);
            receiver.on("userinit", this.userinit.bind(this));
            receiver.on("newuser", this.newuser.bind(this));
            receiver.on("deluser", this.deluser.bind(this));
            receiver.on("inout", this.inout.bind(this));
        }
        ChatUserView.prototype.getContainer = function () {
            return this.container;
        };
        ChatUserView.prototype.clickHandler = function (e) {
            var t = (e.target).parentNode;
            if(/li/i.test(t.tagName) && t.dataset.ip) {
                if(!this.dis.addDisip(t.dataset.ip)) {
                    this.dis.removeDisip(t.dataset.ip);
                }
            }
        };
        ChatUserView.prototype.userinit = function (data) {
            var r = document.createRange();
            r.selectNodeContents(this.userList);
            r.deleteContents();
            r.detach();
            this.userNumber.dataset.actives = "0";
            this.userNumber.dataset.roms = "0";
            data.users.forEach(this.newuser, this);
        };
        ChatUserView.prototype.setusernumber = function (actives, roms) {
            var dataset = this.userNumber.dataset;
            dataset.actives = String(parseInt(dataset.actives) + actives);
            dataset.roms = String(parseInt(dataset.roms) + roms);
            this.userNumber.textContent = "入室" + dataset.actives + (dataset.roms !== "0" ? " (ROM" + dataset.roms + ")" : "");
        };
        ChatUserView.prototype.newuser = function (user) {
            if(user.rom) {
                this.setusernumber(0, 1);
                return;
            }
            this.setusernumber(1, 0);
            this.newuserinfo(user);
        };
        ChatUserView.prototype.newuserinfo = function (user) {
            var li = document.createElement("li");
            var sp = document.createElement("span");
            sp.textContent = user.name;
            sp.title = user.ip + " / " + user.ua;
            li.dataset.id = user.id;
            li.dataset.ip = user.ip;
            li.appendChild(sp);
            this.userList.appendChild(li);
        };
        ChatUserView.prototype.deluser = function (userid) {
            var elem = this.getUserElement(userid);
            if(!elem) {
                this.setusernumber(0, -1);
                return;
            }
            this.setusernumber(-1, 0);
            this.userList.removeChild(elem);
        };
        ChatUserView.prototype.getUserElement = function (id) {
            var lis = this.userList.childNodes;
            for(var i = 0, l = lis.length; i < l; i++) {
                var dataset = (lis[i]).dataset;
                if(dataset && dataset.id === String(id)) {
                    return lis[i];
                }
            }
            return null;
        };
        ChatUserView.prototype.inout = function (user) {
            var elem = this.getUserElement(user.id);
            if(elem) {
                this.userList.removeChild(elem);
            }
            if(user.rom) {
                this.setusernumber(-1, 1);
            } else {
                this.setusernumber(1, -1);
                this.newuserinfo(user);
            }
        };
        return ChatUserView;
    })();
    Chat.ChatUserView = ChatUserView;    
    var ChatUI = (function () {
        function ChatUI(userData, receiver, process, view) {
            this.userData = userData;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
        }
        ChatUI.prototype.getContainer = function () {
            return this.container;
        };
        ChatUI.prototype.getView = function () {
            return this.view;
        };
        ChatUI.prototype.focusComment = function (focus, channel) {
        };
        ChatUI.prototype.refreshSettings = function () {
        };
        return ChatUI;
    })();
    Chat.ChatUI = ChatUI;    
    var ChatNormalUI = (function (_super) {
        __extends(ChatNormalUI, _super);
        function ChatNormalUI(userData, receiver, process, view, dis) {
            var _this = this;
                _super.call(this, userData, receiver, process, view);
            this.userData = userData;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.container = document.createElement("div");
            this.container.classList.add("ui");
            this.inoutForm = new ChatUICollection.InoutForm(this.userData, this.receiver);
            this.container.appendChild(this.inoutForm.getContainer());
            this.commentForm = new ChatUICollection.CommentForm(receiver, false);
            this.container.appendChild(this.commentForm.getContainer());
            this.inoutForm.onInout(function (data) {
                _this.process.inout(data);
            });
            this.commentForm.event.on("comment", function (data) {
                _this.process.comment(data);
            });
            this.commentForm.event.on("changeChannel", function (channel) {
                dis.setFocusChannel(channel || null);
                _this.commentForm.event.emit("afterChangeChannel", false);
            });
            this.commentForm.event.on("afterChangeChannel", function (on) {
                if(on && _this.userData.channelMode == 0) {
                    dis.addFocusOutlaw(true);
                } else {
                    dis.removeFocusOutlaw(true);
                }
            });
        }
        ChatNormalUI.prototype.getContainer = function () {
            return this.container;
        };
        ChatNormalUI.prototype.focusComment = function (focus, channel) {
            if(focus) {
                this.commentForm.focus();
            }
            this.commentForm.setChannel(channel);
            this.commentForm.event.emit("afterChangeChannel", false);
        };
        return ChatNormalUI;
    })(ChatUI);
    Chat.ChatNormalUI = ChatNormalUI;    
    (function (ChatUICollection) {
        var UIObject = (function () {
            function UIObject() {
                this.event = Chat.getEventEmitter();
            }
            UIObject.prototype.getContainer = function () {
                return this.container;
            };
            UIObject.prototype.makeinput = function (callback) {
                var result = document.createElement("input");
                callback(result);
                return result;
            };
            return UIObject;
        })();
        ChatUICollection.UIObject = UIObject;        
        var InoutForm = (function (_super) {
            __extends(InoutForm, _super);
            function InoutForm(userData, receiver) {
                var _this = this;
                        _super.call(this);
                this.userData = userData;
                this.receiver = receiver;
                this.container = document.createElement("form");
                var p;
                p = document.createElement("p");
                this.container.appendChild(p);
                p.appendChild(this.makeinput(function (input) {
                    input.name = "uname";
                    input.size = 20;
                    input.maxLength = 25;
                    input.required = true;
                    input.placeholder = "名前";
                    input.value = _this.userData.name || "";
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.name = "inoutbutton";
                    input.type = "submit";
                    input.value = "入室";
                }));
                this.receiver.on("userinfo", function (data) {
                    (_this.container.elements["uname"]).disabled = !data.rom;
                    (_this.container.elements["inoutbutton"]).value = data.rom ? "入室" : "退室";
                });
                this.container.addEventListener("submit", function (e) {
                    e.preventDefault();
                    _this.emitInout(e);
                }, false);
            }
            InoutForm.prototype.emitInout = function (e) {
                var data = {
                    name: (this.container.elements["uname"]).value
                };
                this.event.emit("inout", data);
            };
            InoutForm.prototype.onInout = function (func) {
                this.event.on("inout", func);
            };
            return InoutForm;
        })(UIObject);
        ChatUICollection.InoutForm = InoutForm;        
        var CommentForm = (function (_super) {
            __extends(CommentForm, _super);
            function CommentForm(receiver, canselable) {
                var _this = this;
                        _super.call(this);
                this.receiver = receiver;
                this.canselable = canselable;
                this.flagFocusOutlaw = false;
                this.container = document.createElement("form");
                this.container.classList.add("commentform");
                var p;
                p = document.createElement("p");
                this.container.appendChild(p);
                var us = receiver.getUserinfo();
                p.appendChild(this.makeinput(function (input) {
                    input.name = "comment";
                    input.type = "text";
                    input.size = 60;
                    input.autocomplete = "off";
                    input.required = true;
                    input.disabled = us.rom;
                    input.addEventListener("input", function (e) {
                        return _this.emitInput();
                    });
                }));
                p.appendChild(document.createTextNode("#"));
                p.appendChild(this.makeinput(function (input) {
                    input.name = "channel";
                    input.type = "text";
                    input.size = 10;
                    input.disabled = us.rom;
                    input.addEventListener("change", function (e) {
                        _this.event.emit("changeChannel", input.value);
                    }, false);
                    input.addEventListener("input", function (e) {
                        if(!input.value || validateHashtag(input.value)) {
                            input.setCustomValidity("");
                        } else {
                            input.setCustomValidity("不正なチャネル名です");
                        }
                    }, false);
                }));
                p.appendChild(this.makeinput(function (input) {
                    input.name = "commentbutton";
                    input.type = "submit";
                    input.value = "発言";
                    input.disabled = us.rom;
                }));
                this.receiver.on("userinfo", function (data) {
                    [
                        "comment", 
                        "channel", 
                        "commentbutton"
                    ].forEach(function (x) {
                        (_this.container.elements[x]).disabled = data.rom;
                    });
                });
                this.container.addEventListener("submit", function (e) {
                    e.preventDefault();
                    _this.emitComment(e);
                    _this.emitInput();
                }, false);
                if(canselable) {
                    p.appendChild(this.makeinput(function (input) {
                        input.name = "canselbutton";
                        input.type = "button";
                        input.value = "キャンセル";
                        input.addEventListener("click", function (e) {
                            _this.event.emit("cancel");
                        }, false);
                    }));
                }
function validateHashtag(channel) {
                    if("string" !== typeof channel) {
                        return false;
                    }
                    if(channel === "") {
                        return false;
                    }
                    if(/\s|#/.test(channel)) {
                        return false;
                    }
                    if(/^\//.test(channel)) {
                        return false;
                    }
                    if(/\/$/.test(channel)) {
                        return false;
                    }
                    if(/\/\//.test(channel)) {
                        return false;
                    }
                    return true;
                }
            }
            CommentForm.prototype.emitComment = function (e) {
                var form = this.container;
                var channel = null;
                var channelvalue = (form.elements["channel"]).value;
                if(channelvalue) {
                    channel = [
                        channelvalue
                    ];
                }
                var data = {
                    comment: (form.elements["comment"]).value,
                    response: null,
                    channel: channel
                };
                this.event.emit("comment", data);
                (form.elements["comment"]).value = "";
            };
            CommentForm.prototype.emitInput = function () {
                if(this.getChannel() != "") {
                    if(this.flagFocusOutlaw) {
                        this.flagFocusOutlaw = false;
                        this.event.emit("afterChangeChannel", false);
                    }
                    return;
                }
                var nowCommentEmpty = (this.container.elements["comment"]).value.length == 0;
                if((this.flagFocusOutlaw && nowCommentEmpty) || (!this.flagFocusOutlaw && !nowCommentEmpty)) {
                    this.event.emit("afterChangeChannel", !nowCommentEmpty);
                }
                this.flagFocusOutlaw = !nowCommentEmpty;
            };
            CommentForm.prototype.focus = function () {
                (this.container.elements["comment"]).focus();
            };
            CommentForm.prototype.setChannel = function (channel) {
                (this.container.elements["channel"]).value = channel ? channel : "";
            };
            CommentForm.prototype.getChannel = function () {
                return (this.container.elements["channel"]).value;
            };
            return CommentForm;
        })(UIObject);
        ChatUICollection.CommentForm = CommentForm;        
        var MottoForm = (function (_super) {
            __extends(MottoForm, _super);
            function MottoForm() {
                var _this = this;
                        _super.call(this);
                this.container = document.createElement("form");
                var p;
                p = document.createElement("p");
                this.container.appendChild(p);
                p.appendChild(this.makeinput(function (input) {
                    input.type = "submit";
                    input.value = "HottoMotto";
                }));
                this.container.addEventListener("submit", function (e) {
                    e.preventDefault();
                    _this.emitMotto(e);
                }, false);
            }
            MottoForm.prototype.emitMotto = function (e) {
                var data = {
                };
                this.event.emit("motto", data);
            };
            MottoForm.prototype.onMotto = function (func) {
                this.event.on("motto", func);
            };
            return MottoForm;
        })(UIObject);
        ChatUICollection.MottoForm = MottoForm;        
        var Console = (function (_super) {
            __extends(Console, _super);
            function Console(userData, receiver, process, ui) {
                        _super.call(this);
                this.userData = userData;
                this.receiver = receiver;
                this.process = process;
                this.ui = ui;
                this.commandlog = [];
                this.commandlogindex = null;
                this.indentSpace = "";
                this.saves = [];
                this.cmode = "down";
                this.makeConsole();
                this.cmdprocess = null;
            }
            Console.prototype.makeConsole = function () {
                var _this = this;
                this.container = document.createElement("div");
                this.container.classList.add("console");
                setUniqueId(this.container, "console");
                this.setHeight(this.userData.cmd.height);
                this.consoleo = document.createElement("pre");
                this.consoleo.classList.add("consoleoutput");
                this.container.appendChild(this.consoleo);
                var p = document.createElement("p");
                this.command = document.createElement("input");
                this.commandtopelement = document.createElement("span");
                this.commandtopelement.textContent = "> ";
                p.appendChild(this.commandtopelement);
                p.appendChild(this.command);
                if(this.cmode === "up") {
                    this.container.insertBefore(p, this.consoleo);
                } else {
                    this.container.appendChild(p);
                }
                this.container.addEventListener("click", function (e) {
                    _this.focusConsole();
                }, false);
                document.addEventListener("keydown", this.keydown.bind(this), false);
            };
            Console.prototype.keydown = function (e) {
                if(this.cmdprocess) {
                    if(!this.cmdprocess.gotKey(e)) {
                        e.preventDefault();
                        return;
                    }
                }
                var act = document.activeElement;
                if(/^input|button$/i.test(act.tagName) && act !== this.command) {
                    return;
                }
                if(e.keyCode === 13 || e.keyCode === 27) {
                    if(!this.container.classList.contains("open")) {
                        this.openConsole();
                        e.preventDefault();
                        return;
                    } else if(this.command.value === "") {
                        this.closeConsole();
                        e.preventDefault();
                        return;
                    }
                }
                if(e.keyCode === 13 && !this.cmdprocess) {
                    this.execCommand(this.command.value);
                    this.command.value = "";
                    this.focusConsole();
                    e.preventDefault();
                    return;
                }
                if((e.keyCode === 38 || e.keyCode === 40) && this.command === document.activeElement && this.container.classList.contains("open")) {
                    if(this.commandlogindex == null) {
                        this.commandlogindex = this.commandlog.length - 1;
                    } else if(e.keyCode === 38) {
                        this.commandlogindex--;
                        if(this.commandlogindex < 0) {
                            this.commandlogindex = 0;
                        }
                    } else {
                        this.commandlogindex++;
                        if(this.commandlogindex >= this.commandlog.length) {
                            this.commandlogindex = this.commandlog.length - 1;
                        }
                    }
                    if(this.commandlog[this.commandlogindex]) {
                        this.command.value = this.commandlog[this.commandlogindex];
                    }
                }
            };
            Console.prototype.openConsole = function () {
                this.container.classList.add("open");
                this.focusConsole();
            };
            Console.prototype.closeConsole = function () {
                this.container.classList.remove("open");
                this.command.blur();
            };
            Console.prototype.focusConsole = function () {
                var sc = document.documentElement.scrollTop || document.body.scrollTop;
                this.command.focus();
                document.documentElement.scrollTop && (document.documentElement.scrollTop = sc);
                document.body.scrollTop && (document.body.scrollTop = sc);
            };
            Console.prototype.setHeight = function (height) {
                if(!height) {
                    height = "30em";
                }
                var st = document.styleSheets.item(0);
                st.insertRule("#" + this.container.id + " { height: " + height + "; bottom:-" + height + "}", st.cssRules.length);
            };
            Console.prototype.openInput = function (topstr) {
                if(topstr != null) {
                    this.commandtopelement.textContent = topstr ? topstr + " " : "";
                }
                this.command.disabled = false;
                (this.command.parentNode).hidden = false;
            };
            Console.prototype.hideInput = function () {
                this.command.disabled = true;
                (this.command.parentNode).hidden = true;
            };
            Console.prototype.setInput = function (str) {
                this.command.value = str;
            };
            Console.prototype.getInput = function () {
                return this.command.value;
            };
            Console.prototype.scrollDown = function () {
                this.container.scrollTop = this.container.scrollHeight - this.container.clientHeight;
            };
            Console.prototype.execCommand = function (line) {
                var syschar = this.userData.cmd.syschar;
                var result = line.match(new RegExp("^\\" + syschar + "(\\S+)\\s*"));
                if(!result && line) {
                    var data = {
                        comment: line,
                        response: null,
                        channel: null
                    };
                    this.process.comment(data);
                    return;
                }
                this.addCommandLog(line);
                this.print("> " + line);
                line = line.slice(result[0].length);
                var errorMessage = this.runCommand(result[1], line);
                if(errorMessage) {
                    this.print(errorMessage, {
                        color: "red"
                    });
                }
            };
            Console.prototype.runCommand = function (name, args) {
                var c = null;
                if(name === "in") {
                    c = ChatCmdProcessCollection.In;
                } else if(name === "out") {
                    c = ChatCmdProcessCollection.Out;
                } else if(name === "motto") {
                    c = ChatCmdProcessCollection.Motto;
                } else if(name === "volume") {
                    c = ChatCmdProcessCollection.Volume;
                } else if(name === "gyoza" || name === "gyazo") {
                    c = ChatCmdProcessCollection.Gyoza;
                } else if(name === "set") {
                    c = ChatCmdProcessCollection.Set;
                } else if(name === "clear" || name === "clean") {
                    c = ChatCmdProcessCollection.Clean;
                } else if(name === "help") {
                    c = ChatCmdProcessCollection.Help;
                } else if(name === "go") {
                    c = ChatCmdProcessCollection.Go;
                } else if(name === "disip") {
                    c = ChatCmdProcessCollection.Disip;
                } else if(name === "dischannel") {
                    c = ChatCmdProcessCollection.Dischannel;
                } else if(name === "sl") {
                    c = ChatCmdProcessCollection.Sl;
                }
                if(c) {
                    var p = new c(this.ui, this, this.process, this.userData, args);
                    this.cmdprocess = p;
                    p.run();
                    return null;
                } else {
                    return "Unknown command: " + name;
                }
            };
            Console.prototype.endProcess = function () {
                this.cmdprocess = null;
                this.openInput(">");
            };
            Console.prototype.addCommandLog = function (line) {
                this.commandlog.push(line);
                if(this.commandlog.length > 50) {
                    this.commandlog.shift();
                }
                this.commandlogindex = null;
            };
            Console.prototype.print = function (str, option) {
                this.put(str + "\n", option);
            };
            Console.prototype.put = function (str, option) {
                var _this = this;
                if(this.indentSpace.length > 0) {
                    str = str.split("\n").map(function (x, i) {
                        return i > 0 && x ? _this.indentSpace + x : x;
                    }).join("\n");
                    if(this.cmode === "up") {
                        var con = this.consoleo.textContent;
                        if(con.length === 0 || con.charAt(0) === "\n") {
                            str = this.indentSpace + str;
                        }
                    } else {
                        if(con.length === 0 || con.charAt(con.length - 1) === "\n") {
                            str = this.indentSpace + str;
                        }
                    }
                }
                if(this.cmode === "up") {
                    var lines = str.split("\n");
                    var df = document.createDocumentFragment();
                    var first = lines.shift();
                    lines.reverse();
                    var remains = lines.join("\n");
                    if(remains) {
                        df.appendChild(makeNode(remains, option));
                    }
                    var tw = document.createTreeWalker(this.consoleo, NodeFilter.SHOW_TEXT, function (node) {
                        return NodeFilter.FILTER_ACCEPT;
                    }, false);
                    var node;
                    while(node = tw.nextNode()) {
                        var idx = node.data.lastIndexOf("\n");
                        if(idx < 0) {
                            continue;
                        }
                        var range = document.createRange();
                        range.setStart(this.consoleo, 0);
                        range.setEnd(node, idx);
                        var c = range.extractContents();
                        this.consoleo.insertBefore(makeNode(first, option), this.consoleo.firstChild);
                        this.consoleo.insertBefore(c, this.consoleo.firstChild);
                        range.detach();
                        break;
                    }
                    if(!node) {
                        this.consoleo.appendChild(node);
                    }
                    this.consoleo.insertBefore(df, this.consoleo.firstChild);
                    this.consoleo.normalize();
                } else {
                    this.consoleo.appendChild(makeNode(str, option));
                    this.consoleo.normalize();
                    this.scrollDown();
                }
                function makeNode(text, option) {
                    var ins;
                    if(!option) {
                        ins = document.createTextNode(text);
                    } else {
                        ins = document.createElement("span");
                        ins.textContent = text;
                        for(var key in option) {
                            if(option[key] != null) {
                                (ins).style.setProperty(key, option[key], null);
                            }
                        }
                    }
                    return ins;
                }
            };
            Console.prototype.indent = function (num, callback) {
                var t = this;
                setindent(num);
                callback();
                setindent(-num);
                function setindent(n) {
                    if(n > 0) {
                        for(var i = 0; i < n; i++) {
                            t.indentSpace += " ";
                        }
                    } else if(n < 0) {
                        t.indentSpace = t.indentSpace.slice(-n);
                    }
                }
            };
            Console.prototype.deletelines = function (num) {
                if(num == null) {
                    this.consoleo.textContent = "";
                    return;
                }
                if(num <= 0) {
                    return;
                }
                var tw = document.createTreeWalker(this.consoleo, NodeFilter.SHOW_TEXT, function (node) {
                    return NodeFilter.FILTER_ACCEPT;
                }, false);
                var node, count = num;
                var range = document.createRange();
                range.selectNodeContents(this.consoleo);
                if(this.cmode === "up") {
                    if(this.consoleo.textContent.charAt(0) === "\n") {
                        count++;
                    }
                    big:
while(node = tw.nextNode()) {
                        var idx = 0;
                        while((idx = node.data.indexOf("\n", idx)) >= 0) {
                            count--;
                            if(count <= 0) {
                                range.setEnd(node, idx);
                                break big;
                            }
                        }
                    }
                } else {
                    var cono = this.consoleo.textContent;
                    if(cono.charAt(cono.length - 1) === "\n") {
                        count++;
                    }
                    big:
while(node = tw.previousNode()) {
                        var idx = 0;
                        while((idx = node.data.lastIndexOf("\n", idx)) >= 0) {
                            count--;
                            if(count <= 0) {
                                range.setStart(node, idx + 1);
                                break big;
                            }
                        }
                    }
                }
                range.deleteContents();
                range.detach();
            };
            Console.prototype.newContext = function () {
                var range = document.createRange();
                range.selectNodeContents(this.consoleo);
                this.saves.push(range.extractContents());
                range.detach();
            };
            Console.prototype.restoreContext = function () {
                var range = document.createRange();
                range.selectNodeContents(this.consoleo);
                range.deleteContents();
                range.insertNode(this.saves.pop());
                range.detach();
            };
            return Console;
        })(UIObject);
        ChatUICollection.Console = Console;        
    })(Chat.ChatUICollection || (Chat.ChatUICollection = {}));
    var ChatUICollection = Chat.ChatUICollection;
    (function (ChatCmdProcessCollection) {
        var Process = (function () {
            function Process(ui, console, process, userData, arg) {
                this.ui = ui;
                this.console = console;
                this.process = process;
                this.userData = userData;
                this.arg = arg;
                this.key = null;
            }
            Process.prototype.parseArg = function () {
                var reqs = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    reqs[_i] = arguments[_i + 0];
                }
                var a = this.arg;
                var result = [];
                var words = [];
                while(a = a.replace(/^\s+/, "")) {
                    var r;
                    if(a.charAt(0) === '"') {
                        r = a.match(/^\"(?:[^\"]|\\")*\"(?=\s+|$)/);
                        if(r) {
                            words.push(r[0]);
                            a = a.slice(r[0].length);
                            continue;
                        }
                    } else if(a.charAt(0) === "'") {
                        r = a.match(/^\'(?:[^\"]|\\')*\'(?=\s+|$)/);
                        if(r) {
                            words.push(r[0]);
                            a = a.slice(r[0].length);
                            continue;
                        }
                    }
                    r = a.match(/^\S+/);
                    if(r) {
                        words.push(r[0]);
                        a = a.slice(r[0].length);
                    }
                }
                var addto = null, addremain = null;
                for(var i = 0, l = words.length; i < l; i++) {
                    var word = words[i];
                    for(var j = 0, m = reqs.length; j < m; j++) {
                        var req = reqs[j];
                        if(!result[j] && req.option) {
                            if(req.name.indexOf(word) >= 0) {
                                addremain = req.num || 0;
                                result[j] = {
                                    active: true,
                                    option: true,
                                    value: word,
                                    params: []
                                };
                                if(addremain) {
                                    addto = result[j];
                                } else {
                                    addto = null;
                                }
                                words.splice(i, 1);
                                i-- , l--;
                                break;
                            }
                        }
                    }
                    if(j === m) {
                        if(addremain && addto) {
                            word = normalize(word);
                            addto.params.push(word);
                            addremain--;
                            words.splice(i, 1);
                            i-- , l--;
                        }
                    }
                }
                for(var j = 0, m = reqs.length; j < m; j++) {
                    if(result[j]) {
                        continue;
                    }
                    var req = reqs[j];
                    if(!req.option) {
                        for(i = 0; i < l; i++) {
                            var word = words[i];
                            result[j] = {
                                active: true,
                                option: false,
                                value: normalize(word)
                            };
                            words.splice(i, 1);
                            i-- , l--;
                            break;
                        }
                    } else {
                        result[j] = {
                            active: false,
                            option: true,
                            value: req.name[0],
                            params: []
                        };
                    }
                }
                for(var j = 0, m = reqs.length; j < m; j++) {
                    if(!result[j]) {
                        var req = reqs[j];
                        result[j] = {
                            active: false,
                            option: req.option,
                            value: req.option ? req.name[0] : null
                        };
                    }
                }
                return result;
                function normalize(word) {
                    var r;
                    if(r = word.match(/^\"(.*)\"$/)) {
                        return r[1];
                    }
                    if(r = word.match(/^\'(.*)\'$/)) {
                        return r[1];
                    }
                    return word;
                }
            };
            Process.prototype.gotKey = function (e) {
                if(!this.key) {
                    return true;
                }
                return this.key(e);
            };
            Process.prototype.print = function (str, option) {
                this.console.print(str, option);
            };
            Process.prototype.put = function (str, option) {
                this.console.put(str, option);
            };
            Process.prototype.error = function (str, option) {
                if (typeof option === "undefined") { option = {
                }; }
                option.color = "#ff6666";
                this.print(str, option);
            };
            Process.prototype.indent = function (num, callback) {
                this.console.indent(num, callback);
            };
            Process.prototype.input = function (multiline, callback) {
                var _this = this;
                this.console.openInput("");
                var result = "";
                this.key = function (e) {
                    if(e.keyCode === 13) {
                        var inp = _this.console.getInput();
                        _this.print(inp);
                        result += inp + "\n";
                        _this.console.setInput("");
                        _this.console.focusConsole();
                        if(!multiline || !e.shiftKey) {
                            _this.console.hideInput();
                            _this.key = null;
                            callback(result);
                        }
                        return false;
                    }
                    return true;
                };
            };
            Process.prototype.inputKey = function (callback) {
                var _this = this;
                this.console.openInput("");
                this.key = function (e) {
                    e.preventDefault();
                    if(!callback(e)) {
                        _this.key = null;
                    }
                    return false;
                };
            };
            Process.prototype.run = function () {
            };
            Process.prototype.die = function () {
                this.console.endProcess();
            };
            Process.prototype.chomp = function (str) {
                return str.replace(/\n+$/, "");
            };
            return Process;
        })();
        ChatCmdProcessCollection.Process = Process;        
        var In = (function (_super) {
            __extends(In, _super);
            function In() {
                _super.apply(this, arguments);

            }
            In.prototype.run = function () {
                var args = this.parseArg({
                    option: false
                }, {
                    option: true,
                    name: [
                        "--auto"
                    ],
                    num: 0
                }, {
                    option: true,
                    name: [
                        "--noauto"
                    ],
                    num: 0
                });
                if(args[1].active) {
                    this.userData.autoin = true;
                    this.userData.save();
                    this.print("autoin set.");
                } else if(args[2].active) {
                    this.userData.autoin = false;
                    this.userData.save();
                    this.print("autoin unset.");
                }
                var data = {
                    name: null
                };
                if(args[0].active) {
                    data.name = args[0].value;
                } else if(this.userData.name) {
                    data.name = this.userData.name;
                } else {
                    this.error("Name required.");
                    this.die();
                    return;
                }
                var result = this.process.inout(data, "in");
                if(!result) {
                    this.error("You are already in the room.");
                }
                this.die();
            };
            return In;
        })(Process);
        ChatCmdProcessCollection.In = In;        
        var Out = (function (_super) {
            __extends(Out, _super);
            function Out() {
                _super.apply(this, arguments);

            }
            Out.prototype.run = function () {
                var data = {
                    name: null
                };
                var result = this.process.inout(data, "out");
                if(!result) {
                    this.error("You are not in the room.");
                }
                this.die();
            };
            return Out;
        })(Process);
        ChatCmdProcessCollection.Out = Out;        
        var Motto = (function (_super) {
            __extends(Motto, _super);
            function Motto() {
                _super.apply(this, arguments);

            }
            Motto.prototype.run = function () {
                var args = this.parseArg({
                    option: false
                }, {
                    option: true,
                    name: [
                        "--gmt", 
                        "--utc"
                    ],
                    num: 0
                });
                var untiltime = null;
                if(args[0].active) {
                    untiltime = (new Date(args[0].value)).getTime();
                    if(!isNaN(untiltime)) {
                        if(!args[1].active) {
                            untiltime += (new Date()).getTimezoneOffset() * 60000;
                        }
                    }
                }
                var data = {
                };
                if(untiltime) {
                    data.until = new Date(untiltime);
                }
                this.process.motto(data);
                this.die();
            };
            return Motto;
        })(Process);
        ChatCmdProcessCollection.Motto = Motto;        
        var Volume = (function (_super) {
            __extends(Volume, _super);
            function Volume() {
                _super.apply(this, arguments);

            }
            Volume.prototype.run = function () {
                var args = this.parseArg({
                    option: false
                });
                if(!args[0].active) {
                    this.print(String(this.userData.volume));
                    this.die();
                    return;
                }
                var vo = parseInt(args[0].value);
                if(isNaN(vo) || vo < 0 || 100 < vo) {
                    this.error("Invalid volume " + args[0].value);
                } else {
                    this.userData.volume = vo;
                    this.userData.save();
                    this.ui.getView().refreshSettings();
                }
                this.die();
            };
            return Volume;
        })(Process);
        ChatCmdProcessCollection.Volume = Volume;        
        var Gyoza = (function (_super) {
            __extends(Gyoza, _super);
            function Gyoza() {
                _super.apply(this, arguments);

            }
            Gyoza.prototype.run = function () {
                var _this = this;
                var args = this.parseArg({
                    option: false
                });
                if(args[0].active) {
                    var mo = parseInt(args[0].value);
                    if(isNaN(mo) || mo < 0 || 2 < mo) {
                        this.error("Invalid gyoza: " + args[0].value);
                    } else {
                        this.userData.gyoza = mo;
                        this.userData.save();
                        this.ui.getView().refreshSettings();
                    }
                }
                [
                    "餃子無展開", 
                    "餃子オンマウス", 
                    "餃子常時"
                ].forEach(function (x, i) {
                    if(_this.userData.gyoza === i) {
                        _this.put("*" + i, {
                            color: "#00ffff"
                        });
                    } else {
                        _this.put(" " + i);
                    }
                    _this.print(": " + x);
                });
                this.die();
            };
            return Gyoza;
        })(Process);
        ChatCmdProcessCollection.Gyoza = Gyoza;        
        var Set = (function (_super) {
            __extends(Set, _super);
            function Set() {
                _super.apply(this, arguments);

            }
            Set.prototype.run = function () {
                var args = this.parseArg({
                    option: false
                }, {
                    option: false
                });
                if(!args[1].active) {
                    this.error("Value is required.");
                    this.die();
                    return;
                }
                var key = args[0].active ? args[0].value : void 0;
                var value = args[1].value;
                switch(key) {
                    case "syschar":
                    case "systemchar":
                        if(value.length !== 1) {
                            this.error("set " + key + ": invalid char " + value);
                            break;
                        }
                        this.userData.cmd.syschar = value;
                        this.userData.save();
                        break;
                    case "height":
                        var vn = parseFloat(value);
                        if(isNaN(vn) || vn < 0) {
                            this.error("set " + key + ": invalid value " + value);
                            break;
                        }
                        this.userData.cmd.height = value + "em";
                        this.userData.save();
                        this.console.setHeight(value + "em");
                        break;
                    default:
                        this.error("Unknown setting: " + key);
                        break;
                }
                this.die();
            };
            return Set;
        })(Process);
        ChatCmdProcessCollection.Set = Set;        
        var Clean = (function (_super) {
            __extends(Clean, _super);
            function Clean() {
                _super.apply(this, arguments);

            }
            Clean.prototype.run = function () {
                this.console.deletelines();
                this.die();
            };
            return Clean;
        })(Process);
        ChatCmdProcessCollection.Clean = Clean;        
        var Help = (function (_super) {
            __extends(Help, _super);
            function Help() {
                _super.apply(this, arguments);

            }
            Help.prototype.run = function () {
                this.print([
                    "command usage: " + this.userData.cmd.syschar + "command", 
                    "in [name] [--auto] [--noauto]", 
                    "	 enter the chatroom", 
                    "	 --auto: auto-enter at the next time", 
                    "	 --noauto: don't auto-enter", 
                    "out", 
                    "	 quit the chatroom", 
                    "motto [until] [--gmt] [--utc]", 
                    "	 HottoMotto", 
                    "	   until(if exists): ex) 2012-01-01, 2013-01-01T00:00", 
                    "volume [number]", 
                    "	 show/set volume", 
                    "set (param) (value)", 
                    "	 set syschar/systemchar", 
                    "		 height", 
                    "gyazo [num], gyoza [num]", 
                    "	 show/set gyoza mode", 
                    "clear, clean", 
                    "	 clean the console", 
                    "disip [-d] [ip] ", 
                    "	 set/remove ip into/from disip list", 
                    "dischannel [-d] [channel]", 
                    "	 set/remove channel into/from dischannel list", 
                    "go [URL|alias|#channelname]", 
                    "	 alias: 'wiki'", 
                    
                ].join("\n"));
                this.die();
            };
            return Help;
        })(Process);
        ChatCmdProcessCollection.Help = Help;        
        var Go = (function (_super) {
            __extends(Go, _super);
            function Go() {
                _super.apply(this, arguments);

            }
            Go.prototype.run = function () {
                var args = this.parseArg({
                    option: false
                });
                if(!args[0].active) {
                    this.die();
                    return;
                }
                var dest = args[0].value;
                if(dest === "wiki") {
                    dest = "http://showigiki.81.la/shogiwiki/";
                } else {
                    var result = dest.match(/^#(\S+)$/);
                    if(result) {
                        this.process.openChannel(result[1]);
                        this.die();
                        return;
                    }
                }
                var a = document.createElement("a");
                a.href = dest;
                a.target = "_blank";
                a.click();
                this.die();
            };
            return Go;
        })(Process);
        ChatCmdProcessCollection.Go = Go;        
        var Disip = (function (_super) {
            __extends(Disip, _super);
            function Disip() {
                _super.apply(this, arguments);

            }
            Disip.prototype.run = function () {
                var _this = this;
                var args = this.parseArg({
                    option: false
                }, {
                    option: true,
                    name: [
                        "-d"
                    ],
                    num: 0
                }, {
                    option: true,
                    name: [
                        "--clean"
                    ],
                    num: 0
                });
                var dis = this.ui.getView().dis;
                if(args[0].active) {
                    var ip = args[0].value;
                    if(args[1].active) {
                        dis.removeDisip(ip);
                    } else {
                        if(!dis.addDisip(ip)) {
                            this.error("Already exists: " + ip);
                        }
                    }
                }
                if(args[2].active) {
                    var diss = this.userData.disip.concat([]);
                    diss.forEach(function (ip) {
                        dis.removeDisip(ip);
                    });
                }
                this.userData.disip.forEach(function (ip) {
                    _this.print(ip);
                });
                this.die();
            };
            return Disip;
        })(Process);
        ChatCmdProcessCollection.Disip = Disip;        
        var Dischannel = (function (_super) {
            __extends(Dischannel, _super);
            function Dischannel() {
                _super.apply(this, arguments);

            }
            Dischannel.prototype.run = function () {
                var _this = this;
                var args = this.parseArg({
                    option: false
                }, {
                    option: true,
                    name: [
                        "-d"
                    ],
                    num: 0
                }, {
                    option: true,
                    name: [
                        "--clean"
                    ],
                    num: 0
                });
                var dis = this.ui.getView().dis;
                if(args[0].active) {
                    var channel = args[0].value;
                    if(/^#\S+$/.test(channel)) {
                        channel = channel.slice(1);
                    }
                    if(args[1].active) {
                        dis.removeDischannel(channel, false, false);
                    } else {
                        if(!dis.addDischannel(channel, false, false)) {
                            this.error("Already exists: " + channel);
                        }
                    }
                }
                if(args[2].active) {
                    var diss = this.userData.dischannel.concat([]);
                    diss.forEach(function (channel) {
                        dis.removeDischannel(channel, false, false);
                    });
                }
                this.userData.dischannel.forEach(function (channel) {
                    _this.print(channel);
                });
                this.die();
            };
            return Dischannel;
        })(Process);
        ChatCmdProcessCollection.Dischannel = Dischannel;        
        var Sl = (function (_super) {
            __extends(Sl, _super);
            function Sl() {
                _super.apply(this, arguments);

            }
            Sl.prototype.run = function () {
                var sl_steam = [
                    [
                        "						(@@) (	) (@)  ( )	@@	  ()	@	  O		@	  O		 @", 
                        "				  (   )", 
                        "			  (@@@@)", 
                        "		   (	)", 
                        "", 
                        "		 (@@@)", 
                        
                    ], 
                    [
                        "					   (  ) (@@) ( )  (@)  ()	 @@    O	 @	   O	 @		O", 
                        "				  (@@@)", 
                        "			  (    )", 
                        "		   (@@@@)", 
                        "", 
                        "		 (	 )", 
                        
                    ]
                ], sl_body = [
                    "	   ====		   ________				   ___________ ", 
                    "  _D _|  |_______/		   \\__I_I_____===__|_________| ", 
                    "	|(_)---  |	 H\\________/ |   |		   =|___ ___|	   _________________		 ", 
                    "	/	  |  |	 H	|  |	 |	 |		   ||_| |_||	 _|				   \\_____A  ", 
                    "  |	  |  |	 H	|__--------------------| [___] |   =|						 |	", 
                    "  | ________|___H__/__|_____/[][]~\\_______|		|	-|						  |  ", 
                    "  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_ ", 
                    
                ], sl_wheels = [
                    [
                        "__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__|__________________________|_ ", 
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ", 
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ", 
                        
                    ], 
                    [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ", 
                        " |/-=|___|=O=====O=====O=====O   |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ", 
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ", 
                        
                    ], 
                    [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ", 
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ", 
                        "  \\_/		 \\O=====O=====O=====O_/	  \\_/				 \\_/	\\_/	\\_/   \\_/    ", 
                        
                    ], 
                    [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ", 
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ", 
                        "  \\_/		 \\_O=====O=====O=====O/	  \\_/				 \\_/	\\_/	\\_/   \\_/    ", 
                        
                    ], 
                    [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ", 
                        " |/-=|___|=   O=====O=====O=====O|_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ", 
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ", 
                        
                    ], 
                    [
                        "__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__|__________________________|_ ", 
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ", 
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ", 
                        
                    ], 
                    
                ];
                var counter = 0, position = 0, sl_length = 90, sp_length = 30;
                var sl_speed = 90;
                var spaces = "";
                for(var i = 0; i < sp_length; i++) {
                    spaces += " ";
                }
                var le = 0;
                var console = this.console, t = this;
                console.newContext();
                console.hideInput();
                this.key = function (e) {
                    return false;
                };
                sl_move();
                function sl_move() {
                    if(counter) {
                        console.deletelines(16);
                    }
                    var wheel = counter % 6;
                    var steam = Math.floor(counter / 3) % 2;
                    var cut = function (x) {
                        return spaces + x.slice(le);
                    };
                    console.print(sl_steam[steam].concat(sl_body, sl_wheels[wheel]).map(cut).join("\n"));
                    counter++;
                    if(spaces.length > 0) {
                        spaces = spaces.slice(1);
                    } else {
                        le++;
                    }
                    if(le < sl_length) {
                        setTimeout(sl_move, sl_speed);
                    } else {
                        console.restoreContext();
                        t.key = null;
                        t.die();
                    }
                }
            };
            return Sl;
        })(Process);
        ChatCmdProcessCollection.Sl = Sl;        
    })(Chat.ChatCmdProcessCollection || (Chat.ChatCmdProcessCollection = {}));
    var ChatCmdProcessCollection = Chat.ChatCmdProcessCollection;
    var ChatCmdUI = (function (_super) {
        __extends(ChatCmdUI, _super);
        function ChatCmdUI(userData, receiver, process, view, dis) {
            var _this = this;
                _super.call(this, userData, receiver, process, view);
            this.userData = userData;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.console = new ChatUICollection.Console(userData, receiver, process, this);
            receiver.on("userinfo", function (data) {
                if(!data.rom && data.name) {
                    _this.console.print("Hello, " + data.name, {
                        color: "#ffff00"
                    });
                }
            });
        }
        ChatCmdUI.prototype.getContainer = function () {
            return this.console.getContainer();
        };
        return ChatCmdUI;
    })(ChatUI);
    Chat.ChatCmdUI = ChatCmdUI;    
    function setUniqueId(element, base) {
        if(!document.getElementById(base)) {
            element.id = base;
            return;
        }
        var number = 0;
        while(document.getElementById(base + number)) {
            number++;
        }
        element.id = base + number;
        return;
    }
    function appearAnimation(el, mode, appear, finish, callback) {
        if (typeof callback === "undefined") { callback = function () {
        }; }
        var cmp = (el.ownerDocument.defaultView).getComputedStyle(el, null);
        if(!cmp.transition) {
            if(!appear && finish) {
                if(el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }
            callback();
            return;
        }
        var inb1, inb2;
        var h;
        if(mode === "vertical") {
            inb1 = el.classList.contains("verticalanime1");
            el.classList.add("verticalanime1");
            h = el.clientHeight;
            if(appear) {
                el.style.height = "0";
            } else {
                el.style.height = h + "px";
            }
        } else if(mode === "horizontal") {
            inb1 = el.classList.contains("horizontalanime1");
            el.classList.add("horizontalanime1");
            h = el.clientWidth;
            if(appear) {
                el.style.width = "0";
            } else {
                el.style.width = h + "px";
            }
        } else if(mode === "fade") {
            inb1 = el.classList.contains("fadeanime1");
            el.classList.add("fadeanime1");
            if(appear) {
                el.style.opacity = "0";
            } else {
                el.style.opacity = "1";
            }
        }
        setTimeout(function () {
            if(mode === "vertical") {
                inb2 = el.classList.contains("verticalanime2");
                el.classList.add("verticalanime2");
            } else if(mode === "horizontal") {
                inb2 = el.classList.contains("horizontalanime2");
                el.classList.add("horizontalanime2");
            } else if(mode === "fade") {
                inb2 = el.classList.contains("fadeanime2");
                el.classList.add("fadeanime2");
            }
            setTimeout(function () {
                if(mode === "vertical") {
                    if(appear) {
                        el.style.height = h + "px";
                    } else {
                        el.style.height = "0";
                    }
                } else if(mode === "horizontal") {
                    if(appear) {
                        el.style.width = h + "px";
                    } else {
                        el.style.width = "0";
                    }
                } else if(mode === "fade") {
                    if(appear) {
                        el.style.opacity = "1";
                    } else {
                        el.style.opacity = "0";
                    }
                }
                var listener;
                el.addEventListener("transitionend", listener = function (e) {
                    if(!inb1) {
                        if(mode === "vertical") {
                            el.classList.remove("verticalanime1");
                        } else if(mode === "horizontal") {
                            el.classList.remove("horizontalanime1");
                        } else if(mode === "fade") {
                            el.classList.remove("fadeanime1");
                        }
                    }
                    if(!inb2) {
                        if(mode === "vertical") {
                            el.classList.remove("verticalanime2");
                        } else if(mode === "horizontal") {
                            el.classList.remove("horizontalanime2");
                        } else if(mode === "fade") {
                            el.classList.remove("fadeanime2");
                        }
                    }
                    if(finish) {
                        if(mode === "vertical") {
                            el.style.removeProperty("height");
                        } else if(mode === "horizontal") {
                            el.style.removeProperty("width");
                        } else if(mode === "fade") {
                            el.style.removeProperty("opacity");
                        }
                        if(!appear) {
                            if(el.parentNode) {
                                el.parentNode.removeChild(el);
                            }
                        }
                    }
                    callback();
                    el.removeEventListener("transitionend", listener, false);
                }, false);
            }, 0);
        }, 0);
    }
    function makeEl(name, callback) {
        var el = document.createElement(name);
        callback(el);
        return el;
    }
    Chat.makeEl = makeEl;
    function createChannelDatasetString(channel) {
        return channel.replace(/\//g, "-");
    }
    Chat.createChannelDatasetString = createChannelDatasetString;
})(Chat || (Chat = {}));
